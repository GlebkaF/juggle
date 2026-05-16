<script setup>
const props = defineProps({
  patterns: { type: Array, required: true },
  colors: { type: Object, required: true },
  isStarted: { type: Function, required: true },
  isDone: { type: Function, required: true },
  isUnlocked: { type: Function, required: true },
});

const positions = {
  'cascade-3': [50, 8],
  'reverse-cascade': [27, 25],
  tennis: [73, 25],
  'half-shower': [50, 30],
  'full-shower': [35, 48],
  shuffle: [65, 48],
  columns: [50, 52],
  'fake-columns': [25, 68],
  box: [50, 72],
  factory: [75, 68],
  'mills-mess': [15, 45],
  'two-one-columns': [50, 86],
  'two-one-clockwise': [30, 102],
  'two-one-counterclockwise': [70, 102],
  '4-fountain': [50, 118],
  '4-sync-fountain': [32, 136],
  '4-async-fountain': [68, 136],
  '5-flash': [84, 90],
  '5-cascade': [84, 112],
  'over-shoulder': [14, 82],
};

const visibleNodes = Object.keys(positions);
const nodes = visibleNodes
  .map((id) => props.patterns.find((pattern) => pattern.id === id))
  .filter(Boolean);

function nodePosition(id) {
  return positions[id] || [50, 50];
}

function nodeStyle(pattern) {
  const [x, y] = nodePosition(pattern.id);
  return {
    left: `${x}%`,
    top: `${y}px`,
    '--node-color': props.colors[pattern.branch] || '#ffb11f',
  };
}

function nodeClass(pattern) {
  return {
    started: props.isStarted(pattern),
    mastered: props.isDone(pattern),
    locked: !props.isUnlocked(pattern),
  };
}

const edges = nodes.flatMap((pattern) =>
  pattern.deps
    .filter((dep) => positions[dep])
    .map((dep) => ({ from: dep, to: pattern.id }))
);

function edgeLine(edge) {
  const [x1, y1] = nodePosition(edge.from);
  const [x2, y2] = nodePosition(edge.to);
  return { x1, y1: y1 + 28, x2, y2: y2 + 28 };
}

function edgeClass(edge) {
  const from = props.patterns.find((pattern) => pattern.id === edge.from);
  const to = props.patterns.find((pattern) => pattern.id === edge.to);
  return {
    active: from && to && props.isStarted(from) && props.isUnlocked(to),
    mastered: from && to && props.isDone(from) && props.isDone(to),
  };
}
</script>

<template>
  <section class="talent-tree-shell">
    <div class="tree-header">
      <div>
        <div class="tree-kicker">talent tree</div>
        <h2>Путь прокачки</h2>
      </div>
      <div class="tree-legend">
        <span><i class="legend-dot locked"></i>locked</span>
        <span><i class="legend-dot started"></i>learning</span>
        <span><i class="legend-dot mastered"></i>mastered</span>
      </div>
    </div>

    <div class="talent-canvas">
      <svg class="tree-lines" viewBox="0 0 100 170" preserveAspectRatio="none" aria-hidden="true">
        <line
          v-for="edge in edges"
          :key="`${edge.from}-${edge.to}`"
          v-bind="edgeLine(edge)"
          :class="edgeClass(edge)"
        />
      </svg>

      <button
        v-for="pattern in nodes"
        :key="pattern.id"
        class="talent-node"
        :class="nodeClass(pattern)"
        :style="nodeStyle(pattern)"
        type="button"
      >
        <span class="node-ring"></span>
        <span class="node-core"></span>
        <span class="node-name">{{ pattern.name }}</span>
      </button>
    </div>
  </section>
</template>
