<script setup lang="ts">
import { onMounted, computed } from 'vue';
import FEACanvas from './components/FEACanvas.vue';
import ElementInfo from './components/ElementInfo.vue';
import MeshControls from './components/MeshControls.vue';
import MaterialSelector from './components/MaterialSelector.vue';
import { useFEAStore } from './store/fea';

const store = useFEAStore();

const stressChangeClass = computed(() => {
  if (!store.stressComparison) return 'text-slate-400';
  return store.stressComparison.changePercent > 0
    ? 'text-red-400'
    : store.stressComparison.changePercent < 0
    ? 'text-green-400'
    : 'text-slate-400';
});

const displacementChangeClass = computed(() => {
  if (!store.displacementComparison) return 'text-slate-400';
  return store.displacementComparison.changePercent > 0
    ? 'text-red-400'
    : store.displacementComparison.changePercent < 0
    ? 'text-green-400'
    : 'text-slate-400';
});

const formatChange = (percent: number) => {
  const sign = percent > 0 ? '+' : '';
  return sign + percent.toFixed(1) + '%';
};

onMounted(() => {
  store.loadPreset('cantilever');
});
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
    <!-- Header -->
    <header class="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
      <h1 class="text-lg font-bold text-purple-400">
        🔬 有限元应力热力图可视化
      </h1>
      <div class="text-xs text-slate-500 flex items-center gap-3">
        <span class="flex items-center gap-1.5">
          <span
            class="w-2.5 h-2.5 rounded-full"
            :style="{ backgroundColor: store.currentMaterial.color }"
          />
          材料: {{ store.currentMaterial.name }}
        </span>
        <span>
          节点: {{ store.model.nodes.length }} |
          单元: {{ store.model.elements.length }}
        </span>
      </div>
    </header>

    <!-- Main content -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Canvas area -->
      <div class="flex-1 p-3" style="width: 72%">
        <FEACanvas />
      </div>

      <!-- Right sidebar -->
      <div class="w-[28%] min-w-[300px] bg-slate-900 border-l border-slate-800 p-3 flex flex-col gap-3 overflow-y-auto">
        <MaterialSelector />
        <MeshControls />
        <ElementInfo />
      </div>
    </div>

    <!-- Bottom status bar -->
    <footer class="bg-slate-900 border-t border-slate-800 px-6 py-2 flex items-center gap-6 text-xs text-slate-400 flex-wrap">
      <span>
        材料:
        <span
          class="font-bold flex items-center gap-1.5 inline-flex"
          :style="{ color: store.currentMaterial.color }"
        >
          <span
            class="w-2 h-2 rounded-full"
            :style="{ backgroundColor: store.currentMaterial.color }"
          />
          {{ store.currentMaterial.name }}
        </span>
      </span>
      <span>
        弹性模量:
        <span class="text-sky-400 font-bold">
          {{ (store.currentMaterial.youngsModulus / 1e9).toFixed(0) }} GPa
        </span>
      </span>
      <span>
        最大应力:
        <span class="text-red-400 font-bold">
          {{ store.result ? (store.maxStress / 1e6).toFixed(2) + ' MPa' : '—' }}
        </span>
        <span
          v-if="store.compareMode && store.stressComparison"
          :class="['ml-1 font-mono font-bold', stressChangeClass]"
        >
          ({{ formatChange(store.stressComparison.changePercent) }})
        </span>
      </span>
      <span>
        最大位移:
        <span class="text-amber-400 font-bold">
          {{ store.result ? (store.maxDisplacement * 1000).toFixed(3) + ' mm' : '—' }}
        </span>
        <span
          v-if="store.compareMode && store.displacementComparison"
          :class="['ml-1 font-mono font-bold', displacementChangeClass]"
        >
          ({{ formatChange(store.displacementComparison.changePercent) }})
        </span>
      </span>
      <span>
        节点数: <span class="text-slate-200">{{ store.model.nodes.length }}</span>
      </span>
      <span>
        单元数: <span class="text-slate-200">{{ store.model.elements.length }}</span>
      </span>
      <span class="ml-auto text-slate-600">
        热力图: {{ store.heatmapMode }}
        <span v-if="store.compareMode" class="text-sky-500 ml-1">| 对比模式</span>
      </span>
    </footer>
  </div>
</template>
