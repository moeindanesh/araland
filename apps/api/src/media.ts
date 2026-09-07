import { mkdir, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { db } from '@araland/db';
import { assert, HttpError } from './security';

export const storageRoot = resolve(process.env.STORAGE_PATH || '../../.storage');
export const publicMediaUrl = (id: string) => `${(process.env.API_PUBLIC_URL || 'http://localhost:4000').replace(/\/$/,'')}/api/media/${id}`;
export async function saveImage(siteId: string, buffer: Buffer, originalName: string) {
  assert(buffer.byteLength <= 12 * 1024 * 1024, 413, 'حجم تصویر باید کمتر از ۱۲ مگابایت باشد.');
  let optimized;
  try {
    optimized = await sharp(buffer, {limitInputPixels: 40_000_000, animated:false}).rotate().resize(2000,2000,{fit:'inside',withoutEnlargement:true}).webp({quality:82}).toBuffer({resolveWithObject:true});
  } catch { throw new HttpError(400, 'تصویر معتبر نیست. تصویر JPG، PNG یا WebP انتخاب کنید.'); }
  const storageKey = `${randomUUID()}.webp`;
  const directory = resolve(storageRoot, 'media');
  await mkdir(directory, {recursive:true});
  await Bun.write(resolve(directory,storageKey),optimized.data);
  try {
    const media = await db.media.create({data:{siteId,storageKey,originalName,mimeType:'image/webp',size:optimized.info.size,width:optimized.info.width,height:optimized.info.height}});
    return {id:media.id,url:publicMediaUrl(media.id),size:media.size,width:media.width,height:media.height,mimeType:media.mimeType};
  } catch(error) {await unlink(resolve(directory,storageKey)).catch(()=>{});throw error;}
}
// Image API contract verified against https://developers.openai.com/api/docs/guides/image-generation (2026-09-06).
export async function generateImage(siteId: string, prompt: string) {
  const key = process.env.OPENAI_API_KEY;
  assert(key, 503, 'تولید تصویر پس از تنظیم سرویس هوش مصنوعی فعال می‌شود.');
  let response: Response;
  try {
    response = await fetch('https://api.openai.com/v1/images/generations', {
      method:'POST', headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},
      body:JSON.stringify({model:process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2',prompt,n:1,size:'1536x1024',quality:'medium',output_format:'webp'}),
      signal:AbortSignal.timeout(150_000),
    });
  } catch {throw new HttpError(503, 'ارتباط با سرویس تولید تصویر برقرار نشد.');}
  const result = await response.json().catch(()=>{throw new HttpError(503,'پاسخ سرویس تولید تصویر معتبر نیست.');}) as {data?:{b64_json?:string}[];error?:{code?:string}};
  if(result.error?.code === 'moderation_blocked') throw new HttpError(400,'سرویس تولید تصویر این توضیح را نپذیرفت. توضیح دیگری بنویسید.');
  assert(response.ok && result.data?.[0]?.b64_json, 503, 'تولید تصویر انجام نشد. تنظیمات و اعتبار سرویس را بررسی کنید.');
  return saveImage(siteId, Buffer.from(result.data[0].b64_json, 'base64'), 'ai-generated.webp');
}
