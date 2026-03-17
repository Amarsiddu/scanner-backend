export function scheduleReminder(booking) {

  const reminderTime =
    new Date(booking.startTime).getTime() - 30 * 60 * 1000;

  console.log("Reminder scheduled for:", new Date(reminderTime));

}