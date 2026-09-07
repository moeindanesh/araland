import { db } from './index';
import { createContent } from '@araland/shared';

const phone = '+989121234567';
const user = await db.user.upsert({where:{phone},update:{},create:{phone,name:'کاربر نمونه'}});
let membership = await db.membership.findFirst({where:{userId:user.id}});
if (!membership) {
  const workspace = await db.workspace.create({data:{name:'فضای کاری نمونه',memberships:{create:{userId:user.id}}}});
  membership = await db.membership.findFirstOrThrow({where:{workspaceId:workspace.id}});
}
const content = createContent('orbit');
const site = await db.site.upsert({where:{slug:'madar-studio'},update:{},create:{workspaceId:membership.workspaceId,name:'استودیو مدار',slug:'madar-studio',templateId:'orbit',draft:content as any,published:content as any,publishedTemplateId:'orbit',publishedName:'استودیو مدار',seo:{title:'استودیو مدار',description:'طراحی و معماری با نگاهی تازه'},publishedSeo:{title:'استودیو مدار',description:'طراحی و معماری با نگاهی تازه'},publishedAt:new Date(),status:'PUBLISHED'}});
if (!await db.siteForm.count({where:{siteId:site.id}})) await db.siteForm.create({data:{siteId:site.id,title:'درخواست مشاوره',fields:[{id:'name',label:'نام و نام خانوادگی',type:'text',required:true},{id:'phone',label:'شماره موبایل',type:'phone',required:true},{id:'message',label:'درباره پروژه‌تان بگویید',type:'textarea',required:false}]}});
if (!await db.post.count({where:{siteId:site.id}})) await db.post.create({data:{siteId:site.id,title:'خانه‌ای که داستان شما را تعریف می‌کند',slug:'a-home-with-your-story',excerpt:'چطور با انتخاب درست نور و متریال، فضایی شخصی بسازیم؟',body:'طراحی خوب از شنیدن شروع می‌شود. پیش از انتخاب رنگ‌ها و مبلمان، به شیوه زندگی خودتان فکر کنید.\n\nنور طبیعی، مواد باکیفیت و چیدمان متناسب با نیازهای روزانه، پایه‌های یک فضای ماندگار هستند.',cover:'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=85',published:true}});
console.log('Seed ready: 09121234567 · /s/madar-studio. Request a development OTP to sign in.');
await db.$disconnect();
