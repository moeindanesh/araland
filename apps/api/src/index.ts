import { createApp } from './app';
const app=createApp().listen({port:Number(process.env.API_PORT || 4000),hostname:process.env.API_HOST || '0.0.0.0'});
console.log(`Araland API listening at http://localhost:${app.server?.port}/api`);
