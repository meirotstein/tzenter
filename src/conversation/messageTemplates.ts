import ejs from "ejs";

export const messages = {
  INITIAL: `שלום, כאן צענטר 🤖 - התפילבוט שלך.

  הזן את מספר האפשרות הרצויה:
  
  1. המניינים שלי
  2. הרשמה למניין
  3. עדכון נוכחות למניין
  4. ספר לי בדיחת אבא
  
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

במידה ותגיעו יותר מאדם אחד, בבקשה הזן את מספר הבאים (כולל אותך) עכשיו

בכדי להתעדכן במצב המניין, או לעדכן את הנוכחות בכל שלב - פשוט תכתוב *עדכון*`,
  SNOOZED_ACCEPTED: `קיבלתי, אני אשאל אותך בהמשך`,
  REJECT_ACCEPTED: "קיבלתי, תודה על העדכון!",
  ATTENDEES_AMOUNT_UPDATE_ACCEPTED: "קיבלתי, תודה על העדכון!",
  MINYAN_REACHED_WITH_LIST: `יש מניין!

המתפללים הבאים אשרו הגעה לתפילת <%= pray %> במניין <%= minyanName %> בשעה <%= hour %>
<% for (let i = 0; i < prayers.length; i++) { %>
<%=(i + 1) + '. ' + prayers[i]%><% } %>


בבקשה להגיע בזמן`,
  SNOOZE_REMINDER: `זוהי תזכורת לתפילת <%= pray %> בשעה <%= hour %> במניין <%= minyanName %>

האם תגיע?`,
  MINYAN_ATTENDANCE_UPDATE: `עדכון לתפילת <%= pray %> בשעה <%= hour %> במניין <%= minyanName %>

 נכון לרגע זה אשרו הגעה <%= prayers.length %> מתפללים
<% for (let i = 0; i < prayers.length; i++) { %>
<%=(i + 1) + '. ' + prayers[i]%><% } %>
`,
  NO_ACTIVE_SCHEDULE: `אין כרגע תזמונים פעילים למניינים שנרשמת אליהם`,
  MULTIPLE_ACTIVE_SCHEDULE_REJECT: `אני מזהה שיש לך יותר מתזמון אחד פעיל למניין זה, בשלב זה לא ניתן לעדכן.`,
  ACTIVE_SCHEDULE_USER_APPROVED: `יש כרגע תזמון פעיל לתפילת <%= pray %> במניין <%= minyanName %> בשעה <%= hour %>

מה אתה מעוניין לעשות?

1. לקבל עדכון לגבי מצב המניין
2. לעדכן את הנוכחות שלי`,
  ACTIVE_SCHEDULE_USER_NOT_APPROVED: `יש כרגע תזמון פעיל לתפילת <%= pray %> במניין <%= minyanName %> בשעה <%= hour %>

האם אתה מעוניין לאשר הגעה?`,
  UPDATE_ATTENDEES_AMOUNT: `הכנס את מספרי המתפללים העדכני שיגיעו למניין (כולל אותך)
במידה ואתה מעוניין להסיר את ההרשמה, הכנס 0`,
  MULTIPLE_ACTIVE_SCHEDULES: `יש כרגע <%= activeCount %> תזמונים פעילים
<% schedules.forEach((s) => { %>
- לתפילת <%= s.prayer %> במניין <%= s.minyan %> בשעה <%= s.time %><% }) %>

מה אתה מעוניין לעשות?
<% actions.forEach((action, index) => { %>
<%= index + 1 %>. <% if (action.actionType === 'status') { %>לקבל עדכון לגבי מצב <%= action.prayer %> במניין <%= action.minyan %><% } else if (action.actionType === 'presence') { %>לעדכן את הנוכחות שלי ב<%= action.prayer %> במניין <%= action.minyan %><% } %><% }) %>
`,
};

export function getMessage(message: string, data: Record<string, any>): string {
  return ejs.render(message, data);
}
