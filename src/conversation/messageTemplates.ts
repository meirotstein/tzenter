import ejs from "ejs";

export const messages = {
  INITIAL: `שלום, כאן צענטר 🤖 - התפילבוט שלך.

  הזן את מספר האפשרות הרצויה:
  
  1. המניינים שלי
  2. הצטרפות למניין
  3. ספר לי בדיחת אבא
  
  [בכל שלב - רק תכתוב צענטר ונחזור לכאן]
  `,
  NO_AVAILABLE_MINYANS: "אין מניינים זמינים כרגע",
  AVAILABLE_MINYANS_LIST: `המניינים הזמינים: 

<% for (let i = 0; i < availableMinyans.length; i++) { 
     const minyan = availableMinyans[i]; 
%>\<%= minyan.minyanIndex + '. ' + minyan.name + (minyan.isUserRegistered ? ' *' : '') %>
<% } %>

 כדי להמשיך יש להזין את מספר המניין הרצוי`,
  REGISTER_MINYAN_CONFIRMATION: `בחרת במניין <%= minyanName %>

האם אתה רוצה להירשם למניין זה?`,
  UNREGISTER_MINYAN_CONFIRMATION: `בחרת במניין <%= minyanName %>

אתה רשום למניין זה, האם אתה מעוניין להסיר את ההרשמה?`,
  REGISTER_MINYAN_SUCCESS: `ההרשמה למניין בוצעה בהצלחה!

מעכשיו, אני אעדכן אותך לגבי תפילות שמתקיימות ושינויים שנוגעים למניין זה.`,
  UNREGISTER_MINYAN_SUCCESS: `ההרשמה למניין הוסרה בהצלחה`,
  NO_REGISTERED_MINYANS: `אתה לא רשום כרגע לאף מניין

האם אתה מעוניין להירשם?`,
  REGISTERED_MINYANS_LIST: `המניינים שלך: 

<% for (let i = 0; i < userMinyans.length; i++) { 
     const minyan = userMinyans[i]; 
%>\<%= minyan.minyanIndex + '. ' + minyan.name %>
<% } %>

 כדי להמשיך יש להזין את מספר המניין הרצוי`,
  APPROVAL_ACCEPTED: `קיבלתי, תודה על העדכון!
אני אמשיך לעדכן אותך לגבי המניין.

במידה ותגיעו יותר מאדם אחד, בבקשה הזן את מספר הבאים (כולל אותך) עכשיו`,
  SNOOZED_ACCEPTED: `קיבלתי, אני אשאל אותך בהמשך`,
  ATTENDEES_AMOUNT_UPDATE_ACCEPTED: "קיבלתי, תודה על העדכון!",
  MINYAN_REACHED_WITH_LIST: `יש מניין!

המתפללים הבאים אשרו הגעה לתפילת <%= pray %> במניין <%= minyanName %> בשעה <%= hour %>
<% for (let i = 0; i < prayers.length; i++) { %>
<%=(i + 1) + '. ' + prayers[i]%><% } %>


בבקשה להגיע בזמן`,
};

export function getMessage(message: string, data: Record<string, any>): string {
  return ejs.render(message, data);
}
