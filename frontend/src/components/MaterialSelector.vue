<script setup lang="ts">
import { ref, computed } from 'vue';
import { useFEAStore, PRESET_MATERIALS } from '../store/fea';
import type { Material } from '../types';

const store = useFEAStore();

const showCustomForm = ref(false);
const customName = ref('');
const customYoungsModulus = ref(200);
const customDensity = ref(7850);
const customYieldStrength = ref(250);
const customColor = ref('#6366f1');

const computedMaterials = computed(() => {
  return store.availableMaterials;
});

const isPresetMaterial = (id: string) => {
  return PRESET_MATERIALS.some((m) => m.id === id);
};

function handleAddCustomMaterial() {
  if (!customName.value.trim()) return;
  const id = 'custom_' + Date.now();
  const newMaterial: Material = {
    id,
    name: customName.value.trim(),
    youngsModulus: customYoungsModulus.value * 1e9,
    density: customDensity.value,
    yieldStrength: customYieldStrength.value * 1e6,
    color: customColor.value,
    description: '自定义材料',
  };
  store.addCustomMaterial(newMaterial);
  store.switchMaterial(id);
  showCustomForm.value = false;
  customName.value = '';
  customYoungsModulus.value = 200;
  customDensity.value = 7850;
  customYieldStrength.value = 250;
}

function formatGPa(pa: number) {
  return (pa / 1e9).toFixed(0);
}

function formatStressChange(percent: number) {
  const sign = percent > 0 ? '+' : '';
  return sign + percent.toFixed(1) + '%';
}

function formatDispChange(percent: number) {
  const sign = percent > 0 ? '+' : '';
  return sign + percent.toFixed(1) + '%';
}

function getChangeColor(percent: number, isStress: boolean) {
  if (isStress) {
    return percent > 0 ? 'text-red-400' : percent < 0 ? 'text-green-400' : 'text-slate-400';
  } else {
    return percent > 0 ? 'text-red-400' : percent < 0 ? 'text-green-400' : 'text-slate-400';
  }
}
</script>

<template>
  <div class="bg-slate-800 rounded-lg p-4 space-y-3">
    <h3 class="text-sm font-bold text-slate-200 border-b border-slate-700 pb-2 flex items-center justify-between">
      <span>🧪 材料方案</span>
      <div
        class="w-3 h-3 rounded-full"
        :style="{ backgroundColor: store.currentMaterial.color }"
        :title="store.currentMaterial.name"
      />
    </h3>

    <!-- Current material info -->
    <div class="bg-slate-900 rounded p-3">
      <div class="flex items-center gap-2 mb-2">
        <div
          class="w-5 h-5 rounded-full"
          :style="{ backgroundColor: store.currentMaterial.color }"
        />
        <span class="text-sm font-bold text-slate-200">{{ store.currentMaterial.name }}</span>
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span class="text-slate-500">弹性模量 </span>
          <span class="font-mono text-sky-400">{{ formatGPa(store.currentMaterial.youngsModulus) }} GPa</span>
        </div>
        <div v-if="store.currentMaterial.density">
          <span class="text-slate-500">密度 </span>
          <span class="font-mono text-amber-400">{{ store.currentMaterial.density }} kg/m³</span>
        </div>
        <div v-if="store.currentMaterial.yieldStrength">
          <span class="text-slate-500">屈服强度 </span>
          <span class="font-mono text-purple-400">{{ (store.currentMaterial.yieldStrength / 1e6).toFixed(0) }} MPa</span>
        </div>
      </div>
      <div v-if="store.currentMaterial.description" class="text-xs text-slate-500 mt-2">
        {{ store.currentMaterial.description }}
      </div>
    </div>

    <!-- Material selection grid -->
    <div>
      <div class="text-xs text-slate-400 mb-1">选择材料</div>
      <div class="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
        <button
          v-for="mat in computedMaterials"
          :key="mat.id"
          @click="store.switchMaterial(mat.id)"
          :class="[
            'flex items-center gap-2 px-2 py-1.5 rounded text-[11px] font-medium transition hover:opacity-90',
            store.currentMaterialId === mat.id
              ? 'bg-sky-700 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600',
          ]"
        >
          <span
            class="w-3 h-3 rounded-full flex-shrink-0"
            :style="{ backgroundColor: mat.color }"
          />
          <span class="truncate">{{ mat.name }}</span>
          <button
            v-if="!isPresetMaterial(mat.id)"
            @click.stop="store.removeCustomMaterial(mat.id)"
            class="ml-auto text-slate-400 hover:text-red-400 text-xs"
            title="删除自定义材料"
          >
            ✕
          </button>
        </button>
      </div>
    </div>

    <!-- Add custom material -->
    <div>
      <button
        v-if="!showCustomForm"
        @click="showCustomForm = true"
        class="w-full py-1.5 rounded text-[11px] font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition"
      >
        + 添加自定义材料
      </button>
      <div v-else class="bg-slate-900 rounded p-3 space-y-2">
        <div class="text-xs font-bold text-slate-300 mb-1">自定义材料参数</div>
        <div>
          <label class="text-[10px] text-slate-400">名称</label>
          <input
            v-model="customName"
            type="text"
            class="w-full mt-0.5 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            placeholder="材料名称"
          />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[10px] text-slate-400">弹性模量 (GPa)</label>
            <input
              v-model.number="customYoungsModulus"
              type="number"
              class="w-full mt-0.5 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>
          <div>
            <label class="text-[10px] text-slate-400">密度 (kg/m³)</label>
            <input
              v-model.number="customDensity"
              type="number"
              class="w-full mt-0.5 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>
          <div>
            <label class="text-[10px] text-slate-400">屈服强度 (MPa)</label>
            <input
              v-model.number="customYieldStrength"
              type="number"
              class="w-full mt-0.5 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>
          <div>
            <label class="text-[10px] text-slate-400">颜色</label>
            <input
              v-model="customColor"
              type="color"
              class="w-full h-7 mt-0.5 bg-slate-800 border border-slate-700 rounded cursor-pointer"
            />
          </div>
        </div>
        <div class="flex gap-1 pt-1">
          <button
            @click="handleAddCustomMaterial"
            class="flex-1 py-1.5 rounded text-[11px] font-bold bg-green-700 text-white hover:bg-green-600 transition"
          >
            确认添加
          </button>
          <button
            @click="showCustomForm = false"
            class="flex-1 py-1.5 rounded text-[11px] font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition"
          >
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- Compare mode toggle -->
    <div class="border-t border-slate-700 pt-3">
      <label class="flex items-center gap-2 cursor-pointer mb-2">
        <input
          type="checkbox"
          :checked="store.compareMode"
          @change="store.toggleCompareMode()"
          class="accent-sky-500"
        />
        <span class="text-xs text-slate-300 font-medium">📊 对比模式</span>
      </label>

      <!-- Comparison panel -->
      <div v-if="store.compareMode" class="space-y-2">
        <div>
          <label class="text-[10px] text-slate-400 mb-1 block">基准材料</label>
          <select
            :value="store.baselineMaterialId"
            @change="store.setBaselineMaterial(($event.target as HTMLSelectElement).value)"
            class="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option v-for="mat in computedMaterials" :key="mat.id" :value="mat.id">
              {{ mat.name }}
            </option>
          </select>
        </div>

        <div class="bg-slate-900 rounded p-2 space-y-1.5" v-if="store.stressComparison || store.displacementComparison">
          <div class="text-[10px] text-slate-500 mb-1">
            与 {{ store.baselineMaterial.name }} 对比
          </div>
          <div class="flex justify-between items-center" v-if="store.stressComparison">
            <span class="text-xs text-slate-400">最大应力变化</span>
            <span
              class="text-xs font-bold font-mono"
              :class="getChangeColor(store.stressComparison.changePercent, true)"
            >
              {{ formatStressChange(store.stressComparison.changePercent) }}
            </span>
          </div>
          <div class="flex justify-between items-center" v-if="store.displacementComparison">
            <span class="text-xs text-slate-400">最大位移变化</span>
            <span
              class="text-xs font-bold font-mono"
              :class="getChangeColor(store.displacementComparison.changePercent, false)"
            >
              {{ formatDispChange(store.displacementComparison.changePercent) }}
            </span>
          </div>

          <!-- Detailed comparison -->
          <div v-if="store.stressComparison && store.displacementComparison" class="border-t border-slate-700 pt-2 mt-2 space-y-1">
            <div class="grid grid-cols-2 gap-2">
              <div class="text-[10px]">
                <div class="text-slate-500">基准应力</div>
                <div class="font-mono text-slate-300">
                  {{ (store.stressComparison.baseline / 1e6).toFixed(2) }} MPa
                </div>
              </div>
              <div class="text-[10px]">
                <div class="text-slate-500">当前应力</div>
                <div class="font-mono text-slate-300">
                  {{ (store.stressComparison.current / 1e6).toFixed(2) }} MPa
                </div>
              </div>
              <div class="text-[10px]">
                <div class="text-slate-500">基准位移</div>
                <div class="font-mono text-slate-300">
                  {{ (store.displacementComparison.baseline * 1000).toFixed(3) }} mm
                </div>
              </div>
              <div class="text-[10px]">
                <div class="text-slate-500">当前位移</div>
                <div class="font-mono text-slate-300">
                  {{ (store.displacementComparison.current * 1000).toFixed(3) }} mm
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="store.compareMode" class="bg-slate-900 rounded p-2 text-xs text-slate-500 text-center">
          请先求解以获取对比数据
        </div>
      </div>
    </div>
  </div>
</template>
