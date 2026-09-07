import { t } from 'elysia';
export const text = (maxLength = 500) => t.String({maxLength});
export const shortText = t.String({minLength: 1, maxLength: 160});
export const templateSchema = t.Union([t.Literal('orbit'), t.Literal('bloom'), t.Literal('forma')]);
const imageUrl = t.String({maxLength: 2048, pattern: '^(https?://[^\\s]+|/api/media/[^\\s]+)$'});
const linkUrl = t.String({maxLength: 2048, pattern: '^(https?://[^\\s]+|mailto:[^\\s]+|tel:[+0-9 -]+|/(?!/)[^\\s]*|#[^\\s]*)$'});
const item = t.Object({id: shortText, title: text(), description: t.Optional(text(5000)), image: t.Optional(imageUrl), url: t.Optional(linkUrl)});
const section = t.Object({
  id: shortText,
  type: t.Union(['hero','services','about','testimonials','faq','contact','instagram','stories','blog'].map(type => t.Literal(type))),
  enabled: t.Boolean(), title: text(), subtitle: t.Optional(text(5000)),
  items: t.Optional(t.Array(item, {maxItems: 40})), image: t.Optional(imageUrl), buttonText: t.Optional(text(100)), buttonUrl: t.Optional(linkUrl),
});
export const contentSchema = t.Object({brand: t.Object({name: shortText, tagline: text(), primaryColor: t.String({pattern:'^#[0-9a-fA-F]{6}$'}),logo:t.Optional(imageUrl)}), sections: t.Array(section, {minItems:1,maxItems:40})});
export const seoSchema = t.Object({title: text(160),description:text(500)});
export const fieldsSchema = t.Array(t.Object({id:t.String({minLength:1,maxLength:80,pattern:'^[a-zA-Z0-9_-]+$'}),label:shortText,type:t.Union([t.Literal('text'),t.Literal('email'),t.Literal('phone'),t.Literal('textarea'),t.Literal('select')]),required:t.Boolean(),options:t.Optional(t.Array(shortText,{maxItems:30}))}),{minItems:1,maxItems:30});
export const postSchema = t.Object({title:shortText,slug:t.String({minLength:1,maxLength:150,pattern:'^[a-zA-Z0-9\\u0600-\\u06FF]+(?:-[a-zA-Z0-9\\u0600-\\u06FF]+)*$'}),excerpt:text(1000),body:text(100_000),cover:t.Optional(t.String({maxLength:2048,pattern:'^https?://[^\\s]+$'})),published:t.Optional(t.Boolean())});
export const postPatchSchema = t.Object({...t.Partial(postSchema).properties,cover:t.Optional(t.Union([t.String({maxLength:2048,pattern:'^https?://[^\\s]+$'}),t.Null()]))});
