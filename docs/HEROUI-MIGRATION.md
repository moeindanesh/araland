# Current migration coordination

User requested real HeroUI components in web manager, supplied IRANYekanXFaNum fonts for manager + mobile, and verification of details. Root owns ui.tsx primitives, font/CSS/config integration, workspace.tsx, auth.tsx, portal.tsx, template-card.tsx. Native agent owns apps/mobile. Panel agent owns ONLY management-panel.tsx and editor.tsx.

Installed HeroUI web v3.2.4 + Tailwind4. Official retrieved docs are .data/heroui-docs/{quick-start,button,modal,input,text-area,checkbox,select,card,alert,tabs,accordion,form,spinner}.md. Installed d.ts/source available in apps/web/node_modules/@heroui/react/dist. No v2 API/provider.

## panel_components task
Migrate management-panel.tsx and editor.tsx to actual HeroUI. Root is building ./ui exports:
- Button (existing HTML props API, loading). HeroUI primary default; type remains HTML default submit to preserve forms.
- Action (existing HTML button props API, visual variant tertiary and neutral geometry, defaults type=button). Replace raw buttons with Action.
- Input, TextArea direct HeroUI primitives, standard HTML input/textarea props. Keep file/color input as native unless better compatible component; preserve validation/ref/form behavior.
- SelectControl props: value:string, onValueChange:(value:string)=>void, options:{value:string,label:string}[], label?:string, aria-label?:string, name?:string, required?:boolean, disabled?:boolean, className?:string. Root implements controlled RAC Select incl hidden form field and RTL. Replace native selects with this contract, native options map to options array; remove wrapping <label> in favor its label prop where relevant.
- CheckControl props: checked:boolean, onCheckedChange:(checked:boolean)=>void, label:string, name?:string, disabled?:boolean. Checkbox renders own label; do not nest within native label. For existing uncontrolled named checkbox, use Hero Checkbox directly or CheckControl with defaultChecked optional (root supports), submit 'on'.
- Panel wraps HeroUI Card with .panel custom layout normalization; render as div to avoid nesting limitations. Replace .panel section/article containers with Panel (keep semantic as prop if desired root supports as='section'|'article'|'div').
- Existing Modal is now HeroUI controlled Modal under hood. No API change.
- Existing Notice becomes HeroUI Alert. No API change.
- Root may add confirmAction reusable HeroUI AlertDialog hook replacing browser confirm; coordinate via file.

Maintain draft/publication and API contract. Fix errors discovered during migration, but avoid backend changes. Include actual form submission success and controlled checkbox/select behavior. No CSS edits (send selectors root). Run typecheck after root exports arrive. No need to individually install dependencies.
