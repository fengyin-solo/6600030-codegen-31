import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { FEAModel, FEAResult, Material, MaterialPlanResult } from '../types';
import {
  solve as feaSolve,
  presetCantileverBeam,
  presetBridgeTruss,
  presetSimpleFrame,
  jetColormap,
} from '../utils/fea-solver';

export const PRESET_MATERIALS: Material[] = [
  {
    id: 'steel',
    name: '结构钢',
    youngsModulus: 200e9,
    density: 7850,
    yieldStrength: 250e6,
    color: '#64748b',
    description: '常用结构材料，强度高',
  },
  {
    id: 'aluminum',
    name: '铝合金',
    youngsModulus: 70e9,
    density: 2700,
    yieldStrength: 276e6,
    color: '#94a3b8',
    description: '轻质材料，耐腐蚀',
  },
  {
    id: 'titanium',
    name: '钛合金',
    youngsModulus: 110e9,
    density: 4506,
    yieldStrength: 900e6,
    color: '#a78bfa',
    description: '高强度重量比，航空用',
  },
  {
    id: 'copper',
    name: '铜',
    youngsModulus: 110e9,
    density: 8960,
    yieldStrength: 70e6,
    color: '#f97316',
    description: '良好导电性和导热性',
  },
  {
    id: 'wood',
    name: '木材',
    youngsModulus: 10e9,
    density: 500,
    yieldStrength: 40e6,
    color: '#a16207',
    description: '天然材料，低密度',
  },
  {
    id: 'concrete',
    name: '混凝土',
    youngsModulus: 30e9,
    density: 2400,
    yieldStrength: 30e6,
    color: '#57534e',
    description: '建筑用，抗压强度高',
  },
  {
    id: 'glass',
    name: '玻璃',
    youngsModulus: 70e9,
    density: 2500,
    yieldStrength: 50e6,
    color: '#22d3ee',
    description: '脆性材料，透明',
  },
  {
    id: 'carbon_fiber',
    name: '碳纤维',
    youngsModulus: 230e9,
    density: 1750,
    yieldStrength: 4000e6,
    color: '#1e293b',
    description: '超高强度，航空航天用',
  },
];

export const useFEAStore = defineStore('fea', () => {
  const model = ref<FEAModel>({ nodes: [], elements: [], loads: [] });
  const result = ref<FEAResult | null>(null);
  const selectedPreset = ref<string>('cantilever');
  const showDeformed = ref(false);
  const deformationScale = ref(10);
  const selectedElement = ref<number | null>(null);
  const heatmapMode = ref<'stress' | 'strain' | 'force'>('stress');

  // ─── Material Plan State ───────────────────────────────────────────────────
  const materials = ref<Material[]>([...PRESET_MATERIALS]);
  const currentMaterialId = ref<string>('steel');
  const materialPlanResults = ref<Map<string, MaterialPlanResult>>(new Map());
  const compareMode = ref(false);
  const baselineMaterialId = ref<string>('steel');

  // ─── Computed for Materials ───────────────────────────────────────────────
  const currentMaterial = computed(() => {
    return materials.value.find((m) => m.id === currentMaterialId.value) || materials.value[0];
  });

  const baselineMaterial = computed(() => {
    return materials.value.find((m) => m.id === baselineMaterialId.value) || materials.value[0];
  });

  const baselineResult = computed(() => {
    return materialPlanResults.value.get(baselineMaterialId.value)?.result || null;
  });

  const stressComparison = computed(() => {
    if (!result.value || !baselineResult.value) return null;
    const baseMax = baselineResult.value.maxStress;
    const currMax = result.value.maxStress;
    if (baseMax === 0) return null;
    return {
      baseline: baseMax,
      current: currMax,
      changePercent: ((currMax - baseMax) / baseMax) * 100,
    };
  });

  const displacementComparison = computed(() => {
    if (!result.value || !baselineResult.value) return null;
    const baseMax = baselineResult.value.maxDisplacement;
    const currMax = result.value.maxDisplacement;
    if (baseMax === 0) return null;
    return {
      baseline: baseMax,
      current: currMax,
      changePercent: ((currMax - baseMax) / baseMax) * 100,
    };
  });

  const availableMaterials = computed(() => materials.value);

  // ─── Actions ──────────────────────────────────────────────────────────────
  function loadPreset(name: string) {
    selectedPreset.value = name;
    result.value = null;
    selectedElement.value = null;
    materialPlanResults.value.clear();
    switch (name) {
      case 'cantilever':
        model.value = presetCantileverBeam();
        break;
      case 'bridge':
        model.value = presetBridgeTruss();
        break;
      case 'frame':
        model.value = presetSimpleFrame();
        break;
      default:
        model.value = presetCantileverBeam();
    }
    applyMaterialToModel(currentMaterial.value);
  }

  function applyMaterialToModel(material: Material) {
    for (const el of model.value.elements) {
      el.youngsModulus = material.youngsModulus;
    }
  }

  function switchMaterial(materialId: string) {
    const material = materials.value.find((m) => m.id === materialId);
    if (!material) return;
    currentMaterialId.value = materialId;
    applyMaterialToModel(material);
    const cached = materialPlanResults.value.get(materialId);
    if (cached) {
      result.value = cached.result;
    } else {
      solve();
    }
  }

  function solve() {
    result.value = feaSolve(model.value);
    if (result.value) {
      materialPlanResults.value.set(currentMaterialId.value, {
        materialId: currentMaterialId.value,
        result: { ...result.value },
        timestamp: Date.now(),
      });
    }
  }

  function addCustomMaterial(material: Material) {
    materials.value.push(material);
  }

  function removeCustomMaterial(materialId: string) {
    const idx = materials.value.findIndex((m) => m.id === materialId);
    if (idx > 0 && !PRESET_MATERIALS.find((m) => m.id === materialId)) {
      materials.value.splice(idx, 1);
      materialPlanResults.value.delete(materialId);
      if (currentMaterialId.value === materialId) {
        switchMaterial('steel');
      }
      if (baselineMaterialId.value === materialId) {
        baselineMaterialId.value = 'steel';
      }
    }
  }

  function toggleCompareMode() {
    compareMode.value = !compareMode.value;
    if (compareMode.value && result.value) {
      baselineMaterialId.value = currentMaterialId.value;
    }
  }

  function setBaselineMaterial(materialId: string) {
    baselineMaterialId.value = materialId;
  }

  function toggleDeformed() {
    showDeformed.value = !showDeformed.value;
  }

  function selectElement(id: number | null) {
    selectedElement.value = id;
  }

  function setHeatmapMode(mode: 'stress' | 'strain' | 'force') {
    heatmapMode.value = mode;
  }

  function addLoad(nodeId: number, fx: number, fy: number) {
    model.value.loads.push({ nodeId, fx, fy });
  }

  function toggleFixed(nodeId: number) {
    const node = model.value.nodes.find((n) => n.id === nodeId);
    if (node) node.fixed = !node.fixed;
  }

  // ─── Computed ─────────────────────────────────────────────────────────────
  const maxStress = computed(() => {
    if (!result.value) return 0;
    return result.value.maxStress;
  });

  const maxDisplacement = computed(() => {
    if (!result.value) return 0;
    return result.value.maxDisplacement;
  });

  const elementColors = computed(() => {
    const colors = new Map<number, string>();
    if (!result.value || model.value.elements.length === 0) {
      for (const el of model.value.elements) {
        colors.set(el.id, '#6b7280');
      }
      return colors;
    }

    let values: number[];
    switch (heatmapMode.value) {
      case 'stress':
        values = result.value.stresses.map(Math.abs);
        break;
      case 'strain':
        values = result.value.strains.map(Math.abs);
        break;
      case 'force':
        values = model.value.elements.map((e) => Math.abs(e.force));
        break;
      default:
        values = result.value.stresses.map(Math.abs);
    }

    const min = Math.min(...values);
    const max = Math.max(...values);

    for (let i = 0; i < model.value.elements.length; i++) {
      colors.set(
        model.value.elements[i].id,
        jetColormap(values[i], min, max)
      );
    }
    return colors;
  });

  return {
    model,
    result,
    selectedPreset,
    showDeformed,
    deformationScale,
    selectedElement,
    heatmapMode,
    maxStress,
    maxDisplacement,
    elementColors,
    materials,
    currentMaterialId,
    currentMaterial,
    baselineMaterialId,
    baselineMaterial,
    baselineResult,
    materialPlanResults,
    compareMode,
    stressComparison,
    displacementComparison,
    availableMaterials,
    loadPreset,
    solve,
    toggleDeformed,
    selectElement,
    setHeatmapMode,
    addLoad,
    toggleFixed,
    switchMaterial,
    addCustomMaterial,
    removeCustomMaterial,
    applyMaterialToModel,
    toggleCompareMode,
    setBaselineMaterial,
  };
});
