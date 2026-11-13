import { describe, it, expect } from "vitest";
import {
  toISTDateString,
  startOfDayIST,
  endOfDayIST,
  getISTHour,
  getISTMinutes,
  getISTMonth,
  makeISTDateTime,
  isSameISTDay,
  formatHourLabel,
} from "./date-utils";

// These functions all pin the timezone to Asia/Kolkata via Intl, so their
// results are independent of the machine timezone the tests run on (CI is UTC).
// The critical class of bug they guard against: a UTC instant that falls on a
// DIFFERENT calendar day in IST than in UTC (anything from 18:30–23:59 UTC).

describe("toISTDateString — UTC↔IST day boundary", () => {
  it("returns the same IST day just before the 18:30 UTC rollover", () => {
    // 18:29:59 UTC = 23:59:59 IST, still 'the 28th' in IST
    expect(toISTDateString(new Date("2026-03-28T18:29:59Z"))).toBe("2026-03-28");
  });

  it("rolls to the next IST day at exactly 18:30 UTC", () => {
    // 18:30:00 UTC = 00:00:00 IST of the next day
    expect(toISTDateString(new Date("2026-03-28T18:30:00Z"))).toBe("2026-03-29");
  });

  it("late-evening UTC is already the next day in IST", () => {
    // 20:00 UTC = 01:30 IST next day
    expect(toISTDateString(new Date("2026-03-28T20:00:00Z"))).toBe("2026-03-29");
  });
});

describe("startOfDayIST / endOfDayIST", () => {
  it("anchors midnight IST for the IST calendar day", () => {
    // IST day is the 29th → 00:00 IST = 18:30 UTC on the 28th
    expect(startOfDayIST(new Date("2026-03-28T20:00:00Z"))).toBe(
      "2026-03-28T18:30:00.000Z"
    );
  });

  it("anchors 23:59:59.999 IST for the IST calendar day", () => {
    // 23:59:59.999 IST on the 29th = 18:29:59.999 UTC on the 29th
    expect(endOfDayIST(new Date("2026-03-28T20:00:00Z"))).toBe(
      "2026-03-29T18:29:59.999Z"
    );
  });
});

describe("getISTHour / getISTMinutes", () => {
  it("reports IST wall-clock time, not UTC", () => {
    const d = new Date("2026-03-28T20:00:00Z"); // 01:30 IST
    expect(getISTHour(d)).toBe(1);
    expect(getISTMinutes(d)).toBe(30);
  });

  it("handles the noon case", () => {
    const d = new Date("2026-03-28T06:30:00Z"); // 12:00 IST
    expect(getISTHour(d)).toBe(12);
    expect(getISTMinutes(d)).toBe(0);
  });
});

describe("getISTMonth — month boundary", () => {
  it("stays in March before the IST rollover", () => {
    expect(getISTMonth(new Date("2026-03-28T20:00:00Z"))).toBe(3);
  });

  it("crosses into April when IST rolls past month-end", () => {
    // 2026-03-31T20:00Z = 2026-04-01 01:30 IST
    expect(getISTMonth(new Date("2026-03-31T20:00:00Z"))).toBe(4);
  });
});

describe("makeISTDateTime", () => {
  it("builds an ISO instant for a given IST wall-clock time on the IST day", () => {
    // IST day of the input is the 29th; 10:00 IST = 04:30 UTC
    const d = new Date("2026-03-28T20:00:00Z");
    expect(makeISTDateTime(d, 10, 0)).toBe("2026-03-29T04:30:00.000Z");
  });

  it("defaults minutes to 0", () => {
    const d = new Date("2026-03-28T20:00:00Z");
    expect(makeISTDateTime(d, 9)).toBe("2026-03-29T03:30:00.000Z");
  });
});

describe("isSameISTDay", () => {
  it("is false across the IST midnight boundary", () => {
    expect(
      isSameISTDay(
        new Date("2026-03-28T18:29:59Z"), // 28th IST
        new Date("2026-03-28T18:30:00Z") // 29th IST
      )
    ).toBe(false);
  });

  it("is true for two instants on the same IST day", () => {
    expect(
      isSameISTDay(
        new Date("2026-03-28T18:30:00Z"), // 29th IST
        new Date("2026-03-29T10:00:00Z") // 29th IST
      )
    ).toBe(true);
  });
});

describe("formatHourLabel", () => {
  it("formats 12-hour labels with AM/PM", () => {
    expect(formatHourLabel(0)).toBe("12 AM");
    expect(formatHourLabel(9)).toBe("9 AM");
    expect(formatHourLabel(12)).toBe("12 PM");
    expect(formatHourLabel(13)).toBe("1 PM");
    expect(formatHourLabel(23)).toBe("11 PM");
  });
});
