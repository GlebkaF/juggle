<script setup>
import { computed, onMounted, ref } from 'vue';
import { loadProgress, saveProgress } from './storage.js';
import SkillTree from './SkillTree.vue';

const levels = [1, 2, 3, 4, 5];
const view = ref('cards');
const branch = ref('All');
const query = ref('');
const state = ref({});

const colors = {
  Cascade: '#ffb11f',
  Shower: '#38d5ff',
  Columns: '#a78bfa',
  Flow: '#ff79c6',
  '4 Ball Prep': '#45e08f',
  '4 Ball': '#2dd4bf',
  '5 Ball': '#ff6b8a',
  'Body Throws': '#e5e7eb',
};

const patterns = [
  { id: 'cascade-3', name: '3 Ball Cascade', branch: 'Cascade', type: 'single', deps: [], diagram: 'cascade', description: 'Базовый перекрёстный паттерн.' },
  { id: 'reverse-cascade', name: 'Reverse Cascade', branch: 'Cascade', type: 'single', deps: ['cascade-3'], diagram: 'reverse', description: 'Каскад наоборот: броски снаружи внутрь.' },
  { id: 'tennis', name: 'Tennis', branch: 'Cascade', type: 'single', deps: ['cascade-3'], diagram: 'tennis', description: 'Один мяч летит дугой поверх каскада.' },
  { id: 'half-shower', name: 'Half Shower', branch: 'Shower', type: 'directional', lanes: ['clockwise', 'counterclockwise'], deps: ['cascade-3'], diagram: 'shower', description: 'Одна рука бросает выше, другая ниже.' },
  { id: 'full-shower', name: 'Full Shower', branch: 'Shower', type: 'directional', lanes: ['clockwise', 'counterclockwise'], deps: ['half-shower'], diagram: 'shower', description: 'Все мячи движутся по кругу.' },
  { id: 'shuffle', name: 'Shuffle', branch: 'Shower', type: 'directional', lanes: ['left', 'right'], deps: ['half-shower'], diagram: 'shower', description: 'Потоковый паттерн с быстрыми переносами.' },
  { id: 'columns', name: 'Columns', branch: 'Columns', type: 'single', deps: ['cascade-3'], diagram: 'columns', description: 'Три почти вертикальные траектории.' },
  { id: 'fake-columns', name: 'Fake Columns', branch: 'Columns', type: 'directional', lanes: ['left', 'right'], deps: ['columns'], diagram: 'fakecolumns', description: 'Иллюзия колонок с обманным движением.' },
  { id: 'box', name: 'Box', branch: 'Columns', type: 'single', deps: ['columns'], diagram: 'box', description: 'Две вертикали и быстрый горизонтальный перенос.' },
  { id: 'factory', name: 'Factory', branch: 'Columns', type: 'directional', lanes: ['left', 'right'], deps: ['columns'], diagram: 'factory', description: 'Одна рука держит столб, другая вращает два мяча.' },
  { id: 'mills-mess', name: 'Mills Mess', branch: 'Flow', type: 'single', deps: ['reverse-cascade'], diagram: 'mills', description: 'Классический flow-паттерн со скрещиванием рук.' },
  { id: 'two-one-columns', name: '2 in One Hand Columns', branch: '4 Ball Prep', type: 'handed', lanes: ['left', 'right'], deps: ['cascade-3'], diagram: 'columns', description: 'Два мяча в одной руке вертикальными бросками.' },
  { id: 'two-one-clockwise', name: '2 in One Hand Clockwise', branch: '4 Ball Prep', type: 'handed', lanes: ['left', 'right'], deps: ['two-one-columns'], diagram: 'circle', description: 'Два мяча в одной руке с вращением по часовой.' },
  { id: 'two-one-counterclockwise', name: '2 in One Hand Counterclockwise', branch: '4 Ball Prep', type: 'handed', lanes: ['left', 'right'], deps: ['two-one-columns'], diagram: 'circle', description: 'Два мяча в одной руке против часовой.' },
  { id: '4-fountain', name: '4 Ball Fountain', branch: '4 Ball', type: 'single', deps: ['two-one-columns'], diagram: 'fountain', description: 'Базовая жонглировка четырьмя мячами.' },
  { id: '4-sync-fountain', name: 'Synchronous Fountain', branch: '4 Ball', type: 'directional', lanes: ['clockwise', 'counterclockwise'], deps: ['4-fountain'], diagram: 'fountain', description: 'Обе руки бросают одновременно; направление отдельно.' },
  { id: '4-async-fountain', name: 'Asynchronous Fountain', branch: '4 Ball', type: 'single', deps: ['4-fountain'], diagram: 'fountain', description: 'Руки работают со сдвигом по времени.' },
  { id: '5-flash', name: '5 Ball Flash', branch: '5 Ball', type: 'single', deps: ['cascade-3'], diagram: 'five', description: 'Все 5 мячей выброшены и пойманы по разу.' },
  { id: '5-cascade', name: '5 Ball Cascade', branch: '5 Ball', type: 'single', deps: ['5-flash'], diagram: 'five', description: 'Базовый устойчивый паттерн на 5 мячей.' },
  { id: 'over-shoulder', name: 'Over the Shoulder Throw', branch: 'Body Throws', type: 'directional', lanes: ['left', 'right'], deps: ['cascade-3'], diagram: 'shoulder', description: 'Бросок через плечо. Optional-ветка.' },
];

onMounted(async () => {
  state.value = await loadProgress();
});

const branches = computed(() => ['All', ...new Set(patterns.map((p) => p.branch))]);
const visibleBranches = computed(() => branches.value.filter((b) => b !== 'All' && (branch.value === 'All' || branch.value === b)));
const visiblePatterns = computed(() => patterns.filter((p) => (branch.value === 'All' || p.branch === branch.value) && (!query.value || `${p.name} ${p.description}`.toLowerCase().includes(query.value.toLowerCase()))));
const doneCount = computed(() => patterns.filter(isDone).length);
const startedCount = computed(() => patterns.filter(isStarted).length);

function lanesOf(pattern) { return pattern.type === 'single' ? ['progress'] : pattern.lanes; }
function keyOf(pattern, lane) { return `${pattern.id}:${lane}`; }
function levelOf(pattern, lane) { return state.value[keyOf(pattern, lane)] || 0; }
function isStarted(pattern) { return lanesOf(pattern).some((lane) => levelOf(pattern, lane) > 0); }
function isDone(pattern) { return lanesOf(pattern).every((lane) => levelOf(pattern, lane) >= 5); }
function isLearning(pattern) { return isStarted(pattern) && !isDone(pattern); }
function average(pattern) { return lanesOf(pattern).reduce((sum, lane) => sum + levelOf(pattern, lane), 0) / lanesOf(pattern).length; }
function isUnlocked(pattern) { return pattern.deps.every((id) => isStarted(patterns.find((p) => p.id === id))); }
function depName(id) { return patterns.find((p) => p.id === id)?.name || id; }
function branchPatterns(name) { return visiblePatterns.value.filter((p) => p.branch === name); }
function branchPercent(items) { return items.length ? Math.round(items.reduce((sum, p) => sum + average(p), 0) / (items.length * 5) * 100) : 0; }

async function setLevel(pattern, lane, level) {
  const key = keyOf(pattern, lane);
  const next = { ...state.value };
  next[key] = next[key] === level ? level - 1 : level;
  if (next[key] <= 0) delete next[key];
  state.value = next;
  await saveProgress(next);
}

const todayItems = computed(() => {
  const inProgress = patterns.filter((p) => isStarted(p) && !isDone(p)).sort((a, b) => average(b) - average(a));
  const weak = patterns.filter(isUnlocked).flatMap((p) => lanesOf(p).map((lane) => ({ p, lane, v: levelOf(p, lane) }))).filter((x) => x.v > 0 && x.v < 4).sort((a, b) => a.v - b.v)[0];
  const repeat = patterns.filter(isDone).find((p) => p.id !== 'cascade-3') || patterns.find(isDone);
  const next = patterns.find((p) => !isStarted(p) && isUnlocked(p));
  return [
    inProgress[0] && { label: 'Основной', pattern: inProgress[0] },
    weak && { label: `Слабая сторона · ${weak.lane}`, pattern: weak.p },
    repeat && { label: 'Повторение', pattern: repeat },
    next && { label: 'Следующий доступный', pattern: next },
  ].filter(Boolean);
});

function iconPaths(type) {
  const balls3 = '<circle class="icon-ball" cx="48" cy="102" r="11"/><circle class="icon-ball" cx="120" cy="104" r="11"/><circle class="icon-ball" cx="192" cy="102" r="11"/>';
  const paths = {
    cascade: '<path class="icon-line" d="M48 102C70 32 111 32 120 104"/><path class="icon-line" d="M192 102C170 32 129 32 120 104"/>' + balls3,
    reverse: '<path class="icon-line" d="M72 112C28 40 92 22 124 86"/><path class="icon-line" d="M168 112C212 40 148 22 116 86"/>' + balls3,
    tennis: '<path class="icon-line" d="M48 102C70 36 110 36 120 104"/><path class="icon-line" d="M192 102C170 36 130 36 120 104"/><path class="icon-thin" d="M44 96C86 14 156 14 196 96"/>' + balls3,
    shower: '<path class="icon-line" d="M50 105C82 20 160 20 190 105"/><path class="icon-thin" d="M190 108C150 130 90 130 50 108"/>' + balls3,
    columns: '<path class="icon-line" d="M64 122V36"/><path class="icon-line" d="M120 122V36"/><path class="icon-line" d="M176 122V36"/>' + balls3,
    fakecolumns: '<path class="icon-line" d="M64 122V42"/><path class="icon-line" d="M176 122V42"/><path class="icon-thin" d="M82 112C112 92 132 92 162 112"/>' + balls3,
    box: '<path class="icon-line" d="M62 122V36"/><path class="icon-line" d="M178 122V36"/><path class="icon-line" d="M72 118C96 132 144 132 168 118"/>' + balls3,
    factory: '<path class="icon-line" d="M86 122V36"/><path class="icon-line" d="M128 122C190 116 190 48 128 42"/><path class="icon-thin" d="M128 42C94 54 94 106 128 122"/>' + balls3,
    mills: '<path class="icon-line" d="M48 108C84 28 136 132 192 52"/><path class="icon-line" d="M192 108C156 28 104 132 48 52"/>' + balls3,
    circle: '<path class="icon-line" d="M88 116C54 52 122 18 152 70"/><path class="icon-line" d="M152 70C184 126 110 140 88 116"/>' + balls3,
    fountain: '<path class="icon-line" d="M82 122C36 44 116 20 102 114"/><path class="icon-line" d="M158 122C204 44 124 20 138 114"/><circle class="icon-ball" cx="82" cy="122" r="10"/><circle class="icon-ball" cx="102" cy="54" r="10"/><circle class="icon-ball" cx="138" cy="54" r="10"/><circle class="icon-ball" cx="158" cy="122" r="10"/>',
    five: '<path class="icon-line" d="M40 112C68 18 114 18 120 112"/><path class="icon-line" d="M200 112C172 18 126 18 120 112"/><circle class="icon-ball" cx="40" cy="112" r="9"/><circle class="icon-ball" cx="80" cy="70" r="9"/><circle class="icon-ball" cx="120" cy="116" r="9"/><circle class="icon-ball" cx="160" cy="70" r="9"/><circle class="icon-ball" cx="200" cy="112" r="9"/>',
    shoulder: '<path class="icon-soft" d="M88 122C92 88 108 70 120 70C132 70 148 88 152 122"/><path class="icon-line" d="M72 104C72 36 156 24 180 86"/>' + balls3,
  };
  return paths[type] || paths.cascade;
}
</script>

<template>
  <div class="app">
    <section class="hero">
      <div>
        <div class="eyebrow">personal skill deck</div>
        <h1 class="title">Juggle<br>Tracker</h1>
        <div class="sub">Карта паттернов без базы данных. Прогресс хранится в IndexedDB с fallback в localStorage.</div>
      </div>
      <div class="stats">
        <div class="stat"><b>{{ doneCount }}</b><span>готово</span></div>
        <div class="stat"><b>{{ startedCount }}</b><span>начато</span></div>
        <div class="stat"><b>{{ patterns.length }}</b><span>всего</span></div>
      </div>
    </section>

    <section class="top">
      <input v-model="query" class="search" placeholder="Поиск паттерна..." />
      <nav class="chips">
        <button v-for="item in branches" :key="item" class="chip" :class="{ active: branch === item }" @click="branch = item">{{ item }}</button>
      </nav>
    </section>

    <section class="scale"><div>1 · проба</div><div>2 · серия</div><div>3 · контроль</div><div>4 · стабильно</div><div>5 · авто</div></section>

    <main v-if="view === 'cards'">
      <section v-for="branchName in visibleBranches" :key="branchName" class="branch">
        <div v-if="branchPatterns(branchName).length" class="branch-head">
          <div class="branch-title" :style="{ color: colors[branchName] }">{{ branchName }}</div>
          <div class="branch-score">{{ branchPercent(branchPatterns(branchName)) }}% · {{ branchPatterns(branchName).filter(isDone).length }}/{{ branchPatterns(branchName).length }}</div>
        </div>
        <div class="grid">
          <article v-for="pattern in branchPatterns(branchName)" :key="pattern.id" class="card" :class="{ mastered: isDone(pattern), locked: !isUnlocked(pattern) }" :style="{ '--family': colors[pattern.branch] }">
            <div class="head">
              <div><div class="label">{{ pattern.branch }}<span v-if="!isUnlocked(pattern)"> · locked</span></div><div class="skill">{{ pattern.name }}<span v-if="isLearning(pattern)" class="star">★</span></div></div>
              <div class="plate"><svg viewBox="0 0 240 160"><rect class="icon-bg" width="240" height="160" rx="24"/><g v-html="iconPaths(pattern.diagram)"></g></svg></div>
            </div>
            <div class="desc">{{ pattern.description }}</div>
            <div class="deps"><span class="dep-title">{{ pattern.deps.length ? 'После:' : 'Стартовый навык' }}</span><span v-for="dep in pattern.deps" :key="dep" class="dep" :class="{ ok: isStarted(patterns.find(p => p.id === dep)) }">{{ depName(dep) }}</span></div>
            <div class="lanes"><div v-for="lane in lanesOf(pattern)" :key="lane" class="lane"><div class="lane-name">{{ lane }}</div><div class="meter"><button v-for="level in levels" :key="level" class="seg" :class="{ on: levelOf(pattern, lane) >= level }" @click="setLevel(pattern, lane, level)"></button></div><div class="lvl">{{ levelOf(pattern, lane) }}/5</div></div></div>
          </article>
        </div>
      </section>
    </main>

    <main v-else-if="view === 'today'">
      <template v-if="todayItems.length">
        <section v-for="item in todayItems" :key="`${item.label}-${item.pattern.id}`">
          <div class="today-label">{{ item.label }}</div>
          <article class="card" :class="{ mastered: isDone(item.pattern), locked: !isUnlocked(item.pattern) }" :style="{ '--family': colors[item.pattern.branch] }">
            <div class="head"><div><div class="label">{{ item.pattern.branch }}</div><div class="skill">{{ item.pattern.name }}<span v-if="isLearning(item.pattern)" class="star">★</span></div></div><div class="plate"><svg viewBox="0 0 240 160"><rect class="icon-bg" width="240" height="160" rx="24"/><g v-html="iconPaths(item.pattern.diagram)"></g></svg></div></div>
            <div class="desc">{{ item.pattern.description }}</div>
            <div class="lanes"><div v-for="lane in lanesOf(item.pattern)" :key="lane" class="lane"><div class="lane-name">{{ lane }}</div><div class="meter"><button v-for="level in levels" :key="level" class="seg" :class="{ on: levelOf(item.pattern, lane) >= level }" @click="setLevel(item.pattern, lane, level)"></button></div><div class="lvl">{{ levelOf(item.pattern, lane) }}/5</div></div></div>
          </article>
        </section>
      </template>
      <div v-else class="empty">Сегодня нечего подсказать.</div>
    </main>

    <main v-else>
      <SkillTree
        :patterns="patterns"
        :colors="colors"
        :is-started="isStarted"
        :is-done="isDone"
        :is-unlocked="isUnlocked"
      />
    </main>
  </div>
  <nav class="nav"><button :class="{ active: view === 'cards' }" @click="view = 'cards'">Карта</button><button :class="{ active: view === 'today' }" @click="view = 'today'">Сегодня</button><button :class="{ active: view === 'tree' }" @click="view = 'tree'">Дерево</button></nav>
</template>