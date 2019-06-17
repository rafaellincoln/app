import Vue from "vue";
import {
  DISCARD_CHANGES,
  ITEM_CREATED,
  START_EDITING,
  UNSTAGE_VALUE,
  STAGE_VALUE
} from "../../mutation-types";

const mutations = {
  [DISCARD_CHANGES](state) {
    state.saving = false;
    state.error = null;
    state.collection = null;
    state.primaryKey = null;
    state.values = {};
  },

  [ITEM_CREATED](state, { data }) {
    state.saving = false;
    state.error = null;
    state.collection = null;
    state.primaryKey = null;
    state.savedItem = data;

    // Don't clear savedValues / edits here
    // Clearing them will cause a flash of no-values on the edit form between the
    // time the values have been saved and the page has navigated away
  },

  [START_EDITING](state, { collection, primaryKey, savedValues }) {
    state.collection = collection;
    state.primaryKey = primaryKey;
    state.savedValues = savedValues;
    state.values = {};
    state.savedItem = {};
  },

  [UNSTAGE_VALUE](state, { field }) {
    Vue.delete(state.values, field);
  },

  [STAGE_VALUE](state, { field, value }) {
    Vue.set(state.values, field, value);
  }
};

export default mutations;
