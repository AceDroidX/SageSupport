<script setup lang="ts">
import { computed, ref } from "vue";

defineExpose({
  open,
  close,
});

function open() {
  dialogVisible.value = true;
}

function close() {
  dialogVisible.value = false;
}

const dialogVisible = ref<boolean>();
const props = withDefaults(
  defineProps<{
    boxClass?: string;
    fullMaxWidth?: boolean;
    fullMaxHeight?: boolean;
  }>(),
  {
    boxClass: "",
    fullMaxWidth: false,
    fullMaxHeight: false,
  },
);
const modalBoxClass = computed(() => {
  let str = props.boxClass;
  if (props.fullMaxWidth) {
    str += "max-w-full w-full";
  }
  if (props.fullMaxHeight) {
    str += "max-h-full h-full";
  }
  return str;
});
</script>

<template>
  <dialog
    class="modal"
    :class="dialogVisible ? 'modal-open' : ''"
    @keyup.esc="dialogVisible = false"
  >
    <div class="modal-box" :class="modalBoxClass">
      <form method="dialog">
        <button
          class="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
          @click="dialogVisible = false"
        >
          ✕
        </button>
      </form>
      <div class="flex flex-col gap-2">
        <slot></slot>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="dialogVisible = false">close</button>
    </form>
  </dialog>
</template>
