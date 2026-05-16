<script setup>
const props = defineProps({
  patterns: { type: Array, required: true },
  colors: { type: Object, required: true },
  isStarted: { type: Function, required: true },
  isDone: { type: Function, required: true },
  isUnlocked: { type: Function, required: true },
});

const nodePositions = {
  'cascade-3': [50, 110, 'major'],

  'reverse-cascade': [17, 300, 'normal'],
  tennis: [35, 300, 'normal'],
  columns: [63, 300, 'normal'],
  'over-shoulder': [84, 300, 'normal'],

  'mills-mess': [12, 500, 'small'],
  'full-shower': [30, 530, 'normal'],
  shuffle: [42, 530, 'normal'],
  'fake-columns': [55, 530, 'normal'],
  box: [67, 530, 'normal'],
  factory: [79, 530, 'normal'],

  '5-flash': [12, 760, 'normal'],
  '5-cascade': [12, 990, 'normal'],

  'two-one-columns': [52, 790, 'major'],
  'two-one-clockwise': [38, 1070, 'normal'],
  'two-one-counterclockwise': [62, 1070, 'normal'],

  '4-fountain': [82, 830, 'normal'],
  '4-sync-fountain': [75, 1160, 'normal'],
  '4-async-fountain': [90, 1160, 'normal'],
};

const childNodes = {
  'full-shower': [
    { id: 'full-shower:cw', label: 'CW', lane: 'clockwise' },
    { id: 'full-shower:ccw', label: 'CCW', lane: 'counterclockwise' },
  ],
  shuffle: [
    { id: 'shuffle:left', label: 'L', lane: 'left' },
    { id: 'shuffle:right', label: 'R', lane: 'right' },
  ],
  'fake-columns': [
    { id: 'fake-columns:left', label: 'L', lane: 'left' },
    { id: 'fake-columns:right', label: 'R', lane: 'right' },
  ],
  factory: [
    { id: 'factory:left', label: 'L', lane: 'left' },
    { id: 'factory:right', label: 'R', lane: 'right' },
  ],
  'two-one-columns': [
    { id: 'two-one-columns:left', label: 'L', lane: 'left' },
    { id: 'two-one-columns:right', label: 'R', lane: 'right' },
  ],
  'two-one-clockwise': [
    { id: 'two-one-clockwise:left', label: 'L', lane: 'left' },
    { id: 'two-one-clockwise:right', label: 'R', lane: 'right' },
  ],
  'two-one-counterclockwise': [
    { id: 'two-one-counterclockwise:left', label: 'L', lane: 'left' },
    { id: 'two-one-counterclockwise:right', label: 'R', lane: 'right' },
  ],
  '4-sync-fountain': [
    { id: '4-sync-fountain:cw', label: 'CW', lane: 'clockwise' },
    { id: '4-sync-fountain:ccw', label: 'CCW', lane: 'counterclockwise' },
  ],
  'over-shoulder': [
    { id: 'over-shoulder:left', label: 'L', lane: 'left' },
    { id: 'over-shoulder:right', label: 'R', lane: 'right' },
  ],
};

const nodes = Object.keys(nodePositions)
  .map((id) => props.patterns.find((pattern) => pattern.id === id))
  .filter(Boolean);

function nodePosition(id) {
  return nodePositions[id] || [50, 500, 'normal'];
}

function nodeRank(pattern) {
  if (!props.isStarted(pattern)) return 0;
  if (props.isDone(pattern)) return 5;
  return 3;
}

function nodeStyle(pattern) {
  const [x, y] = nodePosition(pattern.id);
  return {
    left: `${x}%`,
    top: `${y}px`,
    '--node-color': props.colors[pattern.branch] || '#ffb11f',
    '--rank': nodeRank(pattern),
  };
}

function nodeClass(pattern) {
  const [, , size] = nodePosition(pattern.id);
  return {
    started: props.isStarted(pattern),
    mastered: props.isDone(pattern),
    locked: !props.isUnlocked(pattern),
    major: size === 'major',
    small: size === 'small',
  };
}

const edges = nodes.flatMap((pattern) =>
  pattern.deps
    .filter((dep) => nodePositions[dep])
    .map((dep) => ({ from: dep, to: pattern.id }))
);

function edgeLine(edge) {
  const [x1, y1] = nodePosition(edge.from);
  const [x2, y2] = nodePosition(edge.to);
  return { x1, y1, x2, y2 };
}

function edgeClass(edge) {
  const from = props.patterns.find((pattern) => pattern.id === edge.from);
  const to = props.patterns.find((pattern) => pattern.id === edge.to);
  return {
    active: from && to && props.isStarted(from) && props.isUnlocked(to),
    mastered: from && to && props.isDone(from) && props.isDone(to),
  };
}

function childStyle(pattern, child, index, total) {
  const [x, y] = nodePosition(pattern.id);
  const spread = total === 2 ? 7 : 0;
  const offset = index === 0 ? -spread : spread;
  return {
    left: `${x + offset}%`,
    top: `${y + 120}px`,
    '--node-color': props.colors[pattern.branch] || '#ffb11f',
  };
}

function childClass(pattern) {
  return {
    started: props.isStarted(pattern),
    mastered: props.isDone(pattern),
    locked: !props.isUnlocked(pattern),
  };
}

function childEdges(pattern, child, index, total) {
  const [x, y] = nodePosition(pattern.id);
  const spread = total === 2 ? 7 : 0;
  const childX = x + (index === 0 ? -spread : spread);
  const childY = y + 120;
  return { x1: x, y1: y + 38, x2: childX, y2: childY - 22 };
}
</script>

<template>
  <section class="talent-tree-shell premium-tree">
    <div class="tree-header">
      <div>
        <div class="tree-kicker">personal skill tree</div>
        <h2>Дерево навыков</h2>
      </div>
      <div class="tree-score">
        <strong>110</strong>
        <span>очков навыков</span>
      </div>
    </div>

    <div class="talent-canvas">
      <svg class="tree-lines" viewBox="0 0 100 1480" preserveAspectRatio="none" aria-hidden="true">
        <line
          v-for="edge in edges"
          :key="`${edge.from}-${edge.to}`"
          v-bind="edgeLine(edge)"
          :class="edgeClass(edge)"
        />
        <template v-for="pattern in nodes" :key="`child-lines-${pattern.id}`">
          <line
            v-for="(child, index) in childNodes[pattern.id] || []"
            :key="child.id"
            v-bind="childEdges(pattern, child, index, (childNodes[pattern.id] || []).length)"
            :class="{ active: isStarted(pattern), mastered: isDone(pattern) }"
          />
        </template>
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
        <span class="node-rank">{{ nodeRank(pattern) }}/5</span>
        <span class="node-name">{{ pattern.name }}</span>
      </button>

      <template v-for="pattern in nodes" :key="`children-${pattern.id}`">
        <button
          v-for="(child, index) in childNodes[pattern.id] || []"
          :key="child.id"
          class="talent-node child-node"
          :class="childClass(pattern)"
          :style="childStyle(pattern, child, index, (childNodes[pattern.id] || []).length)"
          type="button"
        >
          <span class="node-ring"></span>
          <span class="node-core"></span>
          <span class="node-rank">0/5</span>
          <span class="node-name">{{ child.label }}</span>
        </button>
      </template>
    </div>

    <div class="tree-state-legend">
      <span><i class="legend-gem mastered"></i> максимум 5/5</span>
      <span><i class="legend-gem started"></i> в процессе 1–4/5</span>
      <span><i class="legend-gem available"></i> доступно 0/5</span>
      <span><i class="legend-gem locked"></i> заблокировано</span>
    </div>
  </section>
</template>
