export const DATA_CHANGED_EVENT = "auto-connect:data-changed";

export const notifyDataChanged = (detail = {}) => {
  window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT, { detail }));
};
