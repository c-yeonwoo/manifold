const KEY = "iam-guest-mode";

export const isGuest = () => typeof window !== "undefined" && localStorage.getItem(KEY) === "1";
export const enableGuest = () => localStorage.setItem(KEY, "1");
export const disableGuest = () => localStorage.removeItem(KEY);
