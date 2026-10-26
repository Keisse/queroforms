export const WORKSHOP_SLUG = 'masterclass-21-novembro';
export const WORKSHOP_DASHBOARD_PATH = '/dashboard/workshop-21-novembro';
export function workshopCopy(value: string) {
  return value.replace(/\besta masterclass\b/gi,'este Workshop').replace(/\bda masterclass\b/gi,'do Workshop').replace(/\bna masterclass\b/gi,'no Workshop').replace(/\ba masterclass\b/gi,'o Workshop').replace(/\bmasterclass\b/gi,'Workshop');
}
export type AggregateOption = { value: string; label: string; count: number };
export type AggregateQuestion = { id: string; title: string; subtitle?: string; input: 'single'|'multi'|'scale'; position: number; historical: boolean; answered: number; options: AggregateOption[] };
export type WorkshopAggregate = { slug: string; title: string; version: number; total: number; daily: { day:string; count:number }[]; questions: AggregateQuestion[] };
export function optionPercent(count: number, answered: number) { return answered > 0 ? Math.round(count / answered * 100) : 0; }
export function activeQuestions(data: WorkshopAggregate) { return data.questions.filter(q=>!q.historical); }
export function publicPayloadIsSafe(data: unknown): data is WorkshopAggregate {
  if (!data || typeof data !== 'object') return false;
  const p=data as Record<string,unknown>;
  const allowed=['slug','title','version','total','daily','questions'];
  if(Object.keys(p).some(k=>!allowed.includes(k))||p.slug!==WORKSHOP_SLUG||typeof p.title!=='string'||!Number.isInteger(p.version)||!Number.isInteger(p.total)||Number(p.total)<0||!Array.isArray(p.daily)||!Array.isArray(p.questions))return false;
  return p.daily.every(d=>d&&Object.keys(d).every(k=>['day','count'].includes(k))&&typeof d.day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d.day)&&Number.isInteger(d.count)&&d.count>=0)&&p.questions.every(q=>q&&Object.keys(q).every(k=>['id','title','subtitle','input','position','historical','answered','options'].includes(k))&&typeof q.id==='string'&&typeof q.title==='string'&&typeof q.historical==='boolean'&&Number.isInteger(q.answered)&&q.answered>=0&&Array.isArray(q.options)&&q.options.every((o:AggregateOption)=>o&&Object.keys(o).every(k=>['value','label','count'].includes(k))&&typeof o.value==='string'&&typeof o.label==='string'&&Number.isInteger(o.count)&&o.count>=0));
}
export function fourteenDays(daily: WorkshopAggregate['daily'], today: string) {
  const map=new Map(daily.map(d=>[d.day,d.count]));
  return Array.from({length:14},(_,i)=>{const d=new Date(`${today}T12:00:00Z`);d.setUTCDate(d.getUTCDate()-13+i);const day=d.toISOString().slice(0,10);return {day,count:map.get(day)||0}});
}
