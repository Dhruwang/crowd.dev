<template>
  <div class="activity-timeline">
    <div class="my-6">
      <el-input
        v-model="query"
        placeholder="Search activities"
        :prefix-icon="SearchIcon"
        clearable
        class="activity-timeline-search"
      >
        <template #append>
          <el-select
            v-model="platform"
            placeholder="All platforms"
            class="w-40"
          >
            <template
              v-if="
                platform && getPlatformDetails(platform)
              "
              #prefix
            >
              <img
                v-if="getPlatformDetails(platform)"
                :alt="getPlatformDetails(platform).name"
                :src="getPlatformDetails(platform).image"
                class="w-4 h-4"
              />
              <i
                v-else
                class="ri-radar-line text-base text-gray-400"
              />
            </template>
            <el-option
              v-for="integration of activeIntegrations"
              :key="integration.id"
              :value="integration.platform"
              :label="integration.label"
              @mouseleave="onSelectMouseLeave"
            >
              <img
                :alt="integration.name"
                :src="integration.image"
                class="w-4 h-4 mr-2"
              />
              {{ integration.label }}
            </el-option>
            <el-option
              value="other"
              label="Other"
              @mouseleave="onSelectMouseLeave"
            >
              <i
                class="ri-radar-line text-base text-gray-400 mr-2"
              />
              Other
            </el-option>
          </el-select>
        </template>
      </el-input>
    </div>
    <div>
      <el-timeline>
        <el-timeline-item
          v-for="activity in activities"
          :key="activity.id"
        >
          <div>
            <app-member-display-name
              v-if="entityType === 'organization'"
              :member="activity.member"
              custom-class="block text-gray-900 font-medium"
              with-link
              class="bl"
            />
            <div class="flex items-center mt-0.5">
              <app-activity-message :activity="activity" />
              <span class="whitespace-nowrap text-gray-500"><span class="mx-1">·</span>{{ timeAgo(activity) }}</span>
              <span
                v-if="activity.sentiment.sentiment"
                class="mx-1"
              >·</span>
              <app-activity-sentiment
                v-if="activity.sentiment.sentiment"
                :sentiment="activity.sentiment.sentiment"
              />
            </div>
            <app-activity-content
              v-if="activity.title || activity.body"
              class="text-sm bg-gray-50 rounded-lg p-4"
              :activity="activity"
              :show-more="true"
            >
              <template v-if="platformDetails(activity.platform)?.activityDisplay?.showContentDetails" #details>
                <div v-if="activity.attributes">
                  <app-activity-content-footer
                    :source-id="activity.sourceId"
                    :changes="activity.attributes.lines"
                    changes-copy="line"
                    :insertions="activity.attributes.insertions"
                    :deletions="activity.attributes.deletions"
                  />
                </div>
              </template>

              <template #bottomLink>
                <div v-if="activity.url" class="pt-6">
                  <app-activity-link
                    :activity="activity"
                  />
                </div>
              </template>
            </app-activity-content>
          </div>
          <template #dot>
            <span
              class="btn btn--circle cursor-auto p-2 bg-gray-100 border border-gray-200"
              :class="`btn--${activity.platform}`"
            >
              <img
                v-if="platformDetails(activity.platform)"
                :src="
                  platformDetails(activity.platform).image
                "
                :alt="`${activity.platform}-icon`"
                class="w-4 h-4"
              />
              <i
                v-else
                class="ri-radar-line text-base text-gray-400"
              />
            </span>
          </template>
        </el-timeline-item>
      </el-timeline>
      <div
        v-if="loading"
        v-loading="loading"
        class="app-page-spinner"
      />
      <div v-if="!noMore" class="flex justify-center pt-4">
        <el-button
          class="btn btn-brand btn-brand--transparent"
          :disabled="loading"
          @click="fetchActivities"
        >
          <i class="ri-arrow-down-line mr-2" />Load
          more
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import isEqual from 'lodash/isEqual';
import { useStore } from 'vuex';
import {
  defineProps,
  computed,
  reactive,
  ref,
  h,
  onMounted,
  watch,
} from 'vue';
import debounce from 'lodash/debounce';
import AppActivityMessage from '@/modules/activity/components/activity-message.vue';
import AppActivitySentiment from '@/modules/activity/components/activity-sentiment.vue';
import AppActivityContent from '@/modules/activity/components/activity-content.vue';
import { onSelectMouseLeave } from '@/utils/select';
import authAxios from '@/shared/axios/auth-axios';
import { formatDateToTimeAgo } from '@/utils/date';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import AppMemberDisplayName from '@/modules/member/components/member-display-name.vue';
import AppActivityLink from '@/modules/activity/components/activity-link.vue';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';
import AppActivityContentFooter from '@/modules/activity/components/activity-content-footer.vue';

const SearchIcon = h(
  'i', // type
  { class: 'ri-search-line' }, // props
  [],
);

const store = useStore();
const props = defineProps({
  entityId: {
    type: String,
    default: null,
  },
  entityType: {
    type: String,
    default: null,
  },
});

const activeIntegrations = computed(() => {
  const activeIntegrationList = store.getters['integration/activeList'];
  return Object.keys(activeIntegrationList).map((i) => ({
    ...activeIntegrationList[i],
    label: CrowdIntegrations.getConfig(i).name,
  }));
});

const loading = ref(true);
const platform = ref(null);
const query = ref('');
const activities = reactive([]);
const limit = ref(20);
const offset = ref(0);
const noMore = ref(false);

let filter = {};

const fetchActivities = async () => {
  const filterToApply = {
    platform: platform.value ?? undefined,
  };

  if (props.entityType === 'member') {
    filterToApply.memberId = props.entityId;
  } else {
    filterToApply[`${props.entityType}s`] = [props.entityId];
  }

  if (props.entityId) {
    if (query.value && query.value !== '') {
      filterToApply.or = [
        {
          body: {
            textContains: query.value,
          },
        },
        {
          channel: {
            textContains: query.value,
          },
        },
        {
          url: {
            textContains: query.value,
          },
        },
        {
          body: {
            textContains: query.value,
          },
        },
        {
          title: {
            textContains: query.value,
          },
        },
        {
          type: {
            textContains: query.value,
          },
        },
      ];
    }
  }

  if (!isEqual(filter, filterToApply)) {
    activities.length = 0;
    offset.value = 0
    noMore.value = false;
  }

  if (noMore.value) {
    return;
  }

  loading.value = true;

  const sampleTenant = AuthCurrentTenant.getSampleTenantData();
  const tenantId = sampleTenant?.id
    || store.getters['auth/currentTenant'].id;

  const { data } = await authAxios.post(
    `/tenant/${tenantId}/activity/query`,
    {
      filter: filterToApply,
      orderBy: 'timestamp_DESC',
      limit: limit.value,
      offset: offset.value,
    },
    {
      headers: {
        Authorization: sampleTenant?.token,
      },
    },
  );

  filter = { ...filterToApply };
  loading.value = false;
  if (data.rows.length < limit.value) {
    noMore.value = true;
    activities.push(...data.rows);
  } else {
    offset.value += limit.value;
    activities.push(...data.rows);
  }
};

const platformDetails = (p) => CrowdIntegrations.getConfig(p);
const timeAgo = (activity) => formatDateToTimeAgo(activity.timestamp);

const debouncedQueryChange = debounce(async () => {
  await fetchActivities();
}, 300);

const getPlatformDetails = (p) => CrowdIntegrations.getConfig(p);

watch(query, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    debouncedQueryChange();
  }
});

watch(platform, async (newValue, oldValue) => {
  if (newValue !== oldValue) {
    await fetchActivities();
  }
});

onMounted(async () => {
  if (activeIntegrations.value.length === 0) {
    await store.dispatch('integration/doFetch');
  }
  await fetchActivities();
});
</script>

<script>
export default {
  name: 'AppMemberViewActivities',
};
</script>

<style lang="scss">
.activity-timeline {
  .el-input-group__append {
    @apply bg-white;

    .el-select .el-input .el-input__wrapper {
      border-radius: 0 6px 6px 0 !important;
    }
  }
  .activity-header {
    @apply max-w-full overflow-visible;
  }
  .el-timeline-item__dot {
    @apply relative;
  }
  .el-timeline-item__wrapper {
    @apply top-1 pl-4;
  }
  .el-timeline-item__tail {
    @apply left-4;
  }
}
</style>
