<template>
  <div class="collections">
    <v-header-bar :breadcrumb="breadcrumb">
      <template slot="buttons">
        <v-header-button
          icon="add"
          key="add"
          color="action"
          :label="$t('new')"
          @click="addNew = true" />
      </template>
    </v-header-bar>
    <v-error
      v-if="items.length === 0"
      :title="$t('no_collections')"
      :body="$t('no_collections_body')"
      icon="error_outline" />
    <v-table
      v-else
      :items="items"
      :columns="fields"
      primary-key-field="collection"
      link="__link__" />
    <portal to="modal" v-if="addNew">
      <v-prompt :message="$t('create_collection')" :placeholder="$t('enter_collection_name')" v-model="newName" :confirm-text="$t('create')" :loading="adding" @cancel="addNew = false" @confirm="add" />
    </portal>
  </div>
</template>

<script>
export default {
  name: "settings-collections",
  data() {
    return {
      addNew: false,
      newName: "",
      adding: false
    };
  },
  computed: {
    items() {
      const collections = this.$store.state.collections || {};

      return Object.values(collections).map(collection => ({
        ...collection,
        collection: this.$t(`collections-${collection.collection}`),
        __link__: `/settings/collections/${collection.collection}`
      }));
    },
    fields() {
      return [
        {
          field: "collection",
          name: this.$t("collection")
        },
        {
          field: "note",
          name: this.$t("note")
        }
      ];
    },
    breadcrumb() {
      return [
        {
          name: this.$t("settings"),
          path: "/settings",
          color: "warning"
        },
        {
          name: this.$t("collections"),
          path: "/settings/collections"
        }
      ];
    }
  },
  methods: {
    add() {
      this.adding = true;

      this.$api
        .createCollection({
          collection: this.newName,
          hidden: 0,
          fields: [
            {
              type: "INT",
              field: "id",
              interface: "primary-key",
              auto_increment: true,
              primary_key: true
            }
          ]
        })
        .then(res => res.data)
        .then(collection => {
          this.$store.dispatch("addCollection", collection);
          this.$router.push(`/settings/collections/${this.newName}`);
        })
        .catch(console.error); // eslint-disable-line no-console
    }
  }
};
</script>

<style lang="scss" scoped>
.collections {
  padding-bottom: var(--page-padding-bottom);
}
</style>