<template>
  <div class="matrix">
    <template>
      <div v-for="(item, index) in matrixCollections" :key="item.collection" class="item-matrix">
        <div class="row">
          <div class="column">
            <v-select
              :id="`${name} - ${index}`"
              :name="`${name} - ${index}`"
              :placeholder="''"
              :options="selectOptions"
              :value="valueCollection(index)"
              :disabled="itemDisabled(index)"
              @input="select($event, index, 'collection')"
            ></v-select>
            <v-select
              :id="`${name}-${index}-ID`"
              :name="`${name}-${index}-ID`"
              :placeholder="''"
              :options="selectOptionsCollection(index)"
              :value="valueCollectionID(index)"
              :disabled="itemDisabled(index)"
              @input="select($event, index, 'collectionID')"
            ></v-select>
          </div>
          <div>
            <button type="button" class="style-btn select" @click="removeItem(index)">
              <i class="material-icons">close</i>
              {{ $t("delete") }}
            </button>
          </div>
          <div>
            <v-spinner
              v-show="loading"
              line-fg-color="var(--light-gray)"
              line-bg-color="var(--lighter-gray)"
              class="spinner"
            ></v-spinner>
          </div>
        </div>
      </div>
    </template>
    <template>
      <button type="button" class="style-btn select" @click="addNew">
        <i class="material-icons">add</i>
        {{ $t("add_new") }}
      </button>
    </template>
  </div>
</template>

<script>
import mixin from "@directus/extension-toolkit/mixins/interface";

export default {
  name: "Matrix",
  mixins: [mixin],
  data() {
    return {
      loading: false,
      error: null,
      items: [],
      count: null,

      collectionsDeleted: [],
      CollectionsSave: [
        {
          collection: "select_a_collection",
          collectionID: 0,
          options: [],
          newItem: true
        }
      ]
    };
  },
  computed: {
    collectionsInput() {
      return this.$lodash.map(this.matrixCollections, item => {
        return {
          id: item.matrixID,
          collection: this.fields.id.collection,
          collection_id: this.values.id,
          component_collection: item.collection,
          component_collection_id: item.collectionID,
          status: "published"
        };
      });
    },
    itemDisabled() {
      return index => {
        return !this.matrixCollections[index].newItem;
      };
    },
    matrixCollections() {
      return this.CollectionsSave;
    },
    render() {
      return item => {
        const collection = this.$helpers.micromustache.compile("{{collection}}")(item);

        let out = "";
        collection.split("_").forEach(function(el) {
          const add = el.toLowerCase();
          out += add[0].toUpperCase() + add.slice(1) + " ";
        });
        return out.trim();
      };
    },
    renderCollection() {
      return this.$helpers.micromustache.compile(this.options.template);
    },
    selectOptions() {
      if (this.items.length === 0) return {};

      return this.$lodash.mapValues(this.$lodash.keyBy(this.items, "collection"), item =>
        this.render(item)
      );
    },
    selectOptionsCollection() {
      return index => {
        const { options } = this.matrixCollections[index];
        if (options.length === 0) return {};

        return this.$lodash.mapValues(this.$lodash.keyBy(options, "id"), item =>
          this.renderCollection(item)
        );
      };
    },
    valueCollection() {
      return index => this.matrixCollections[index].collection;
    },
    valueCollectionID() {
      return index => this.matrixCollections[index].collectionID;
    }
  },
  watch: {
    CollectionsSave() {
      this.$lodash.forEach(this.matrixCollections, (item, index) => {
        if (!item.options.length) {
          this.fetchItemsCollection(item.collection, index);
        }
      });
    }
  },
  created() {
    const _this = this;
    this.$store.watch(
      function(state) {
        return state.edits;
      },
      function({ savedItem }) {
        if (!savedItem || !savedItem.id) return;

        _this.$lodash.forEach(_this.collectionsDeleted, item => {
          _this.$api.deleteItem("ene_matrix", item.matrixID);
        });

        /* _this.$lodash.forEach(_this.matrixCollections, item => {
          if (item.collectionID && item.newItem) {
            const newItem = {
              collection: _this.fields.id.collection,
              collection_id: savedItem.id,
              component_collection: item.collection,
              component_collection_id: item.collectionID,
              status: "published"
            };

            // _this.$api.createItem('ene_matrix', newItem);
          }
        }); */
      },
      {
        deep: true //add this if u need to watch object properties change etc.
      }
    );
    this.fetchMatrix();
    this.fetchItems();
  },
  beforeDestroy() {
    this.CollectionsSave = [
      {
        collection: "select_a_collection",
        collectionID: 0,
        options: [],
        newItem: true
      }
    ];
  },
  methods: {
    addNew() {
      this.CollectionsSave.push({
        collection: "select_a_collection",
        collectionID: 0,
        options: [],
        newItem: true
      });
    },
    removeItem(index) {
      const { newItem } = this.CollectionsSave[index];
      if (!newItem) {
        this.collectionsDeleted.push(this.CollectionsSave[index]);
      }
      this.$delete(this.CollectionsSave, index);
      this.$emit("input", this.collectionsInput);
    },
    select(value, index, key) {
      this.CollectionsSave[index][key] = value;

      if (key === "collection") {
        return this.fetchItemsCollection(value, index);
      }

      console.log("collectionsInput", this.collectionsInput);
      this.$emit("input", this.collectionsInput);
    },
    fetchMatrix() {
      if (this.newItem) return;

      const { collection } = this.fields.id;

      const params = { fields: "*.*", filter: { collection, collection_id: this.values.id } };
      this.$api.getItems("ene_matrix", params).then(({ data: items }) => {
        this.CollectionsSave = this.$lodash.map(items, item => ({
          matrixID: item.id,
          collection: item.component_collection,
          collectionID: item.component_collection_id,
          options: [],
          newItem: false
        }));
      });
    },
    fetchItems() {
      if (this.relation == null) return;

      this.loading = true;

      const params = { fields: "*.*" };

      this.$api
        .getItems("directus_collections", params)
        .then(({ data: items }) => {
          const newItems = [{ id: 0, collection: "select_a_collection" }, ...items];
          this.items = this.$lodash.filter(newItems, function(item) {
            return !item.collection.includes("directus_") && item.collection !== "ene_matrix";
          });

          this.loading = false;
        })
        .catch(error => {
          console.error(error);
          this.error = error;
          this.loading = false;
        });
    },
    fetchItemsCollection(collection, index) {
      if (collection === "select_a_collection") return;
      this.loading = true;

      const params = { fields: "*.*", limit: this.options.threshold };

      this.$api
        .getItems(collection, params)
        .then(({ data: items }) => {
          this.CollectionsSave[index]["options"] = [{ id: 0, name: "Select a item" }, ...items];

          this.loading = false;
        })
        .catch(error => {
          console.error(error);
          this.error = error;
          this.loading = false;
        });
    }
  }
};
</script>

<style lang="scss" scoped>
.matrix {
  position: relative;
  max-width: var(--width-medium);

  button {
    text-align: left;
    color: var(--gray);
    font-size: 10px;
    text-transform: uppercase;
    font-weight: 700;
    transition: color var(--fast) var(--transition);

    &:hover {
      transition: none;
      color: var(--darker-gray);
    }
  }
}

.row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.column {
  display: flex;
  flex-direction: column;
  min-width: 75%;
}

.item-matrix {
  margin-bottom: 12px;
}

.v-select {
  margin-top: 0;
}

.spinner {
  position: absolute;
  right: -50px;
  top: 50%;
  transform: translateY(-50%);
}
</style>
