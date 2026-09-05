import {createEmptyCard,fsrs,Rating,type Card,type ReviewLog} from 'ts-fsrs';
export type StoredCard=Omit<Card,'due'|'last_review'>&{due:number;last_review:number|null};
export type StoredReview=Omit<ReviewLog,'due'|'review'>&{due:number;review:number};
const scheduler=fsrs({request_retention:0.9,enable_fuzz:false});
const serialize=(card:Card):StoredCard=>({...card,due:card.due.getTime(),last_review:card.last_review?.getTime()??null});
export function initialCard(now:number):StoredCard{return serialize(createEmptyCard(now))}
export function nextReview(stored:StoredCard|undefined,status:string,now:number){if(stored){for(const field of ['due','stability','difficulty','elapsed_days','scheduled_days','reps','lapses','state']as const){if(typeof stored[field]!=='number'||!Number.isFinite(stored[field])||stored[field]<0)throw new Error('This review record needs attention. Please keep a backup.')}if(stored.last_review!==null&&(!Number.isFinite(stored.last_review)||stored.last_review>now))throw new Error('Review dates are invalid.');}const result=scheduler.next(stored??createEmptyCard(now),now,status==='Review again'?Rating.Again:status==='Still unsure'?Rating.Hard:Rating.Good);return{card:serialize(result.card),log:{...result.log,due:result.log.due.getTime(),review:result.log.review.getTime()} as StoredReview}}
