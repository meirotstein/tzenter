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
};

export function getMessage(message: string, data: Record<string, any>): string {
  return ejs.render(message, data);
}
