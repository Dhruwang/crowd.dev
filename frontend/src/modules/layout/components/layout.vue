<template>
  <el-container>
    <app-menu />
    <el-container :style="elMainStyle">
      <el-main id="main-page-wrapper" class="relative">
        <div
          :class="{
            'pt-14': showBanner,
          }"
        >
          <banner
            v-if="showSampleDataAlert"
            variant="alert"
          >
            <div
              class="flex items-center justify-center grow text-sm"
            >
              This workspace is using sample data. Connect
              your first integration to start fetching real
              data
              <router-link :to="{ name: 'integration' }">
                <el-button
                  class="btn btn--sm btn--primary ml-4"
                  :loading="loading"
                >
                  Connect integration
                </el-button>
              </router-link>
            </div>
          </banner>
          <banner
            v-if="showIntegrationsErrorAlert"
            variant="alert"
          >
            <div
              class="flex items-center justify-center grow text-sm"
            >
              Currently you have integrations with
              connectivity issues
              <router-link
                :to="{ name: 'integration' }"
                class="btn btn--sm btn--primary ml-4"
              >
                Go to Integrations
              </router-link>
            </div>
          </banner>

          <banner
            v-if="showIntegrationsNoDataAlert"
            variant="alert"
          >
            <div
              class="flex items-center justify-center grow text-sm"
            >
              Currently you have integrations that are not
              receiving activities
              <router-link
                :to="{ name: 'integration' }"
                class="btn btn--sm btn--primary ml-4"
              >
                Go to Integrations
              </router-link>
            </div>
          </banner>

          <banner
            v-if="showIntegrationsInProgressAlert"
            variant="info"
          >
            <div
              class="flex items-center justify-center grow text-sm"
            >
              <div
                v-loading="true"
                class="w-4 h-4 mr-2"
              />
              <span class="font-semibold mr-1">{{
                integrationsInProgressToString
              }}
                integration{{
                  integrationsInProgress.length > 1
                    ? 's are'
                    : ' is'
                }}
                getting set up.</span>
              Sit back and relax. We will send you an email
              when it’s done.
            </div>
          </banner>
        </div>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import Banner from '@/shared/banner/banner.vue';
import identify from '@/shared/monitoring/identify';
import AppMenu from '@/modules/layout/components/menu.vue';

export default {
  name: 'AppLayout',

  components: {
    AppMenu,
    Banner,
  },

  data() {
    return {
      fetchIntegrationTimer: null,
      loading: false,
    };
  },

  computed: {
    ...mapGetters({
      collapsed: 'layout/menuCollapsed',
      isMobile: 'layout/isMobile',
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
      integrationsInProgress: 'integration/inProgress',
      integrationsWithErrors: 'integration/withErrors',
      integrationsWithNoData: 'integration/withNoData',
      showSampleDataAlert: 'tenant/showSampleDataAlert',
      showIntegrationsErrorAlert:
        'tenant/showIntegrationsErrorAlert',
      showIntegrationsNoDataAlert:
        'tenant/showIntegrationsNoDataAlert',
      showIntegrationsInProgressAlert:
        'tenant/showIntegrationsInProgressAlert',
      showBanner: 'tenant/showBanner',
    }),
    integrationsInProgressToString() {
      const arr = this.integrationsInProgress.map(
        (i) => i.name,
      );
      if (arr.length === 1) {
        return arr[0];
      } if (arr.length === 2) {
        return `${arr[0]} and ${arr[1]}`;
      }
      return (
        `${arr.slice(0, arr.length - 1).join(', ')
        }, and ${
          arr.slice(-1)}`
      );
    },
    elMainStyle() {
      if (this.isMobile && !this.collapsed) {
        return {
          display: 'none',
        };
      }

      return null;
    },
  },

  created() {
    if (this.isMobile) {
      this.collapseMenu();
    }
    this.fetchIntegrationTimer = setInterval(async () => {
      if (this.integrationsInProgress.length === 0) clearInterval(this.fetchIntegrationTimer);
    }, 30000);
  },

  async mounted() {
    identify(this.currentUser);
    this.initPendo();
  },

  unmounted() {
    clearInterval(this.fetchIntegrationTimer);
  },

  methods: {
    ...mapActions({
      collapseMenu: 'layout/collapseMenu',
    }),

    initPendo() {
      // This function creates anonymous visitor IDs in Pendo unless you change the visitor id field to use your app's values
      // This function uses the placeholder 'ACCOUNT-UNIQUE-ID' value for account ID unless you change the account id field to use your app's values
      // Call this function in your authentication promise handler or callback when your visitor and account id values are available
      // Please use Strings, Numbers, or Bools for value types.
      window.pendo.initialize({
        visitor: {
          id: this.currentUser.id, // Required if user is logged in, default creates anonymous ID
          email: this.currentUser.email, // Recommended if using Pendo Feedback, or NPS Email
          full_name: this.currentUser.fullName, // Recommended if using Pendo Feedback
          // role:         // Optional

          // You can add any additional visitor level key-values here,
          // as long as it's not one of the above reserved names.
        },

        account: {
          id: this.currentTenant?.id, // Required if using Pendo Feedback, default uses the value 'ACCOUNT-UNIQUE-ID'
          name: this.currentTenant?.name, // Optional
          is_paying: this.currentTenant?.plan !== 'Essential', // Recommended if using Pendo Feedback
          // monthly_value:// Recommended if using Pendo Feedback
          // planLevel:    // Optional
          // planPrice:    // Optional
          // creationDate: // Optional

          // You can add any additional account level key-values here,
          // as long as it's not one of the above reserved names.
        },
      });
    },
  },
};
</script>
