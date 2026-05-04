import { useEffect, useRef } from "react";
import { getTodayISO } from "../lib/date";
import { t } from "../lib/i18n";

export default function useAlarmNotifications({
  routines,
  alarmTasks,
  notify,
  language,
  isRoutineScheduledOnDate,
}) {
  const firedAlarmKeysRef = useRef(new Set());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const now = new Date();
      const todayISODate = getTodayISO();
      const hhmm = now.toTimeString().slice(0, 5);

      const notifyAlarm = (key, title, body) => {
        if (firedAlarmKeysRef.current.has(key)) return;
        firedAlarmKeysRef.current.add(key);

        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          new Notification(title, { body });
          return;
        }

        notify(`${title}: ${body}`, "warn");
      };

      routines
        .filter(
          (routine) =>
            routine.is_active &&
            routine.alarm_enabled &&
            isRoutineScheduledOnDate(routine, todayISODate) &&
            routine.alarm_time === hhmm,
        )
        .forEach((routine) => {
          notifyAlarm(
            `routine-${routine.id}-${todayISODate}-${hhmm}`,
            t("notifications.routineAlarmTitle", language),
            t("notifications.routineAlarmBody", language, {
              title: routine.title,
            }),
          );
        });

      alarmTasks
        .filter(
          (task) =>
            task.task_date === todayISODate &&
            !task.is_done &&
            task.alarm_enabled &&
            task.alarm_time === hhmm,
        )
        .forEach((task) => {
          notifyAlarm(
            `task-${task.id}-${todayISODate}-${hhmm}`,
            t("notifications.taskAlarmTitle", language),
            t("notifications.taskAlarmBody", language, {
              content: task.content,
            }),
          );
        });
    }, 15_000);

    return () => window.clearInterval(intervalId);
  }, [routines, alarmTasks, notify, language, isRoutineScheduledOnDate]);
}
