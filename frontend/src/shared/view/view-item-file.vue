<template>
  <el-form-item v-if="!isBlank" :label="label">
    <el-col :lg="11" :md="16" :sm="24">
      <div v-for="item in value" :key="item.name">
        <strong>
          <a
            :href="item.downloadUrl"
            download
            target="_blank"
            rel="noopener noreferrer"
          >{{ item.name }}</a>
        </strong>
      </div>
    </el-col>
  </el-form-item>
</template>

<script>
export default {
  name: 'AppViewItemFile',

  props: {
    label: {
      type: String,
      default: null,
    },
    value: {
      type: String,
      default: null,
    },
  },

  computed: {
    isBlank() {
      return !this.value || !this.value.length;
    },
  },
};
</script>

<style></style>
