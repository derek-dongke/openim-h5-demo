import { IMSDK } from "@/utils/imCommon";
import {
  ConversationItem,
  GroupItem,
  GroupMemberItem,
  MessageItem,
} from "open-im-sdk-wasm/lib/types/entity";

import { defineStore } from "pinia";
import store from "../index";
import useContactStore from "./contact";
import useUserStore from "./user";

interface StateType {
  conversationList: ConversationItem[];
  currentConversation: ConversationItem;
  unReadCount: number;
  currentGroupInfo: GroupItem;
  currentMemberInGroup: GroupMemberItem;
}

const useStore = defineStore("conversation", {
  state: (): StateType => ({
    conversationList: [],
    currentConversation: {} as ConversationItem,
    unReadCount: 0,
    currentGroupInfo: {} as GroupItem,
    currentMemberInGroup: {} as GroupMemberItem,
  }),
  getters: {
    storeConversationList: (state) => state.conversationList,
    storeCurrentConversation: (state) => state.currentConversation,
    storeUnReadCount: (state) => state.unReadCount,
    storeCurrentGroupInfo: (state) => state.currentGroupInfo,
    storeCurrentMemberInGroup: (state) => state.currentMemberInGroup,
  },
  actions: {
    async getConversationListFromReq(isScrollLoad = false): Promise<boolean> {
      try {
        const { data } = await IMSDK.getConversationListSplit({
          offset: isScrollLoad ? this.conversationList.length : 0,
          count: 20,
        });
        const cves = data;
        this.conversationList = [
          ...(isScrollLoad ? this.conversationList : []),
          ...cves,
        ];
        return cves.length === 20;
      } catch (error) {
        return false;
      }
    },
    async getUnReadCountFromReq() {
      const { data } = await IMSDK.getTotalUnreadMsgCount();
      this.unReadCount = data;
    },
    updateUnReadCount(data: number) {
      this.unReadCount = data;
    },
    async getCurrentGroupInfoFromReq(groupID?: string) {
      const contactStore = useContactStore();
      const sourceID = groupID ?? this.currentConversation.groupID;
      const localGroup = contactStore.storeGroupList.find(
        (group) => group.groupID === sourceID
      );
      if (localGroup) {
        this.currentGroupInfo = localGroup;
        return;
      }
      try {
        const { data } = await IMSDK.getGroupsInfo([sourceID]);
        this.currentGroupInfo = data[0] ?? {};
      } catch (error) {
        console.error(error);
      }
    },
    updateCurrentGroupInfo(item: GroupItem) {
      this.currentGroupInfo = { ...item };
    },
    async getCurrentMemberInGroupFromReq(groupID?: string) {
      const userStore = useUserStore();

      try {
        const { data } = await IMSDK.getGroupMembersInfo({
          groupID: groupID ?? this.currentConversation.groupID,
          userIDList: [userStore.storeSelfInfo.userID],
        });
        this.currentMemberInGroup = data[0] ?? {};
      } catch (error) {
        console.error(error);
      }
    },
    updateCurrentMemberInGroup(item: GroupMemberItem) {
      this.currentMemberInGroup = { ...item };
    },
    updateCurrentConversation(item: ConversationItem) {
      this.currentConversation = { ...item };
    },
    updateConversationList(list: ConversationItem[]) {
      this.conversationList = [...list];
    },
    delConversationByCID(conversationID: string) {
      const idx = this.conversationList.findIndex(
        (cve) => cve.conversationID === conversationID
      );
      if (idx !== -1) {
        this.conversationList.splice(idx, 1);
      }
    },
  },
});

export default function useConversationStore() {
  return useStore(store);
}
