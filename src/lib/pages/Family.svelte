<script>
  import Icon from '../components/Icon.svelte'
  import Modal from '../components/Modal.svelte'
  import {
    familyMembers,
    addMember,
    updateMember,
    deleteMember
  } from '../stores/familyMembers.js'
  import { medicines } from '../stores/medicines.js'
  import { medicationRecords } from '../stores/medicationRecords.js'
  import {
    ALLERGY_TYPES,
    CHRONIC_DISEASES,
    ORGAN_FUNCTION,
    ORGAN_FUNCTION_LABELS,
    ORGAN_FUNCTION_COLORS
  } from '../utils/constants.js'
  import { calculateAge, isChild, isElderly } from '../utils/medicationSafety.js'

  const AVATARS = ['👤', '👩', '👨', '👶', '👧', '👦', '👵', '👴', '🧑', '👨‍🦰', '👩‍🦰', '👨‍🦱']
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']
  const RELATIONS = ['本人', '配偶', '子女', '父母', '祖父母', '其他亲属']

  let showFormModal = false
  let showDeleteConfirm = false
  let editingMember = null
  let deletingMemberId = null
  let customAllergyInput = ''
  let longTermMedInput = ''

  let form = getDefaultForm()

  function getDefaultForm() {
    return {
      name: '',
      avatar: '👤',
      color: COLORS[0],
      relation: '本人',
      birthDate: '',
      allergies: [],
      customAllergies: [],
      chronicDiseases: [],
      longTermMedications: [],
      liverFunction: ORGAN_FUNCTION.NORMAL,
      kidneyFunction: ORGAN_FUNCTION.NORMAL,
      weight: null
    }
  }

  function resetForm() {
    form = getDefaultForm()
    customAllergyInput = ''
    longTermMedInput = ''
  }

  function openAddForm() {
    editingMember = null
    resetForm()
    showFormModal = true
  }

  function openEditForm(member) {
    editingMember = member
    form = {
      ...getDefaultForm(),
      ...member,
      allergies: member.allergies ? [...member.allergies] : [],
      customAllergies: member.customAllergies ? [...member.customAllergies] : [],
      chronicDiseases: member.chronicDiseases ? [...member.chronicDiseases] : [],
      longTermMedications: member.longTermMedications ? [...member.longTermMedications] : []
    }
    showFormModal = true
  }

  function toggleAllergy(value) {
    const idx = form.allergies.indexOf(value)
    if (idx >= 0) {
      form.allergies.splice(idx, 1)
    } else {
      form.allergies.push(value)
    }
    form = form
  }

  function addCustomAllergy() {
    const val = customAllergyInput.trim()
    if (val && !form.customAllergies.includes(val)) {
      form.customAllergies.push(val)
      form = form
    }
    customAllergyInput = ''
  }

  function removeCustomAllergy(idx) {
    form.customAllergies.splice(idx, 1)
    form = form
  }

  function toggleChronicDisease(value) {
    const idx = form.chronicDiseases.indexOf(value)
    if (idx >= 0) {
      form.chronicDiseases.splice(idx, 1)
    } else {
      form.chronicDiseases.push(value)
    }
    form = form
  }

  function addLongTermMed() {
    const val = longTermMedInput.trim()
    if (val && !form.longTermMedications.includes(val)) {
      form.longTermMedications.push(val)
      form = form
    }
    longTermMedInput = ''
  }

  function removeLongTermMed(idx) {
    form.longTermMedications.splice(idx, 1)
    form = form
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      alert('请输入成员姓名')
      return
    }
    if (editingMember) {
      updateMember(editingMember.id, form)
    } else {
      addMember(form)
    }
    showFormModal = false
  }

  function requestDelete(id) {
    deletingMemberId = id
    showDeleteConfirm = true
  }

  function confirmDelete() {
    if (deletingMemberId) {
      deleteMember(deletingMemberId)
      showDeleteConfirm = false
      deletingMemberId = null
    }
  }

  function cancelDelete() {
    showDeleteConfirm = false
    deletingMemberId = null
  }

  function getMedicinesCount(memberId) {
    return $medicines.filter((m) => m.familyMemberIds?.includes(memberId)).length
  }

  function getRecordsCount(memberId) {
    return $medicationRecords.filter((r) => r.familyMemberId === memberId).length
  }

  function getAllergyLabels(member) {
    const labels = []
    for (const a of member.allergies || []) {
      const found = ALLERGY_TYPES.find((t) => t.value === a)
      if (found) labels.push(found.label)
    }
    if (member.customAllergies) labels.push(...member.customAllergies)
    return labels
  }

  function getChronicLabels(member) {
    const labels = []
    for (const d of member.chronicDiseases || []) {
      const found = CHRONIC_DISEASES.find((t) => t.value === d)
      if (found) labels.push(found.label)
    }
    return labels
  }

  function getMemberAgeText(member) {
    const age = calculateAge(member.birthDate)
    if (age == null) return ''
    if (isChild(age)) return `${age}岁 · 儿童`
    if (isElderly(age)) return `${age}岁 · 老人`
    return `${age}岁`
  }
</script>

<div class="h-full flex flex-col">
  <div class="p-6 border-b border-medical-blue-50 bg-white">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-medical-text-primary">家庭成员</h2>
        <p class="text-sm text-medical-text-secondary mt-1">共 {$familyMembers.length} 位家庭成员</p>
      </div>
      <button class="btn-primary" on:click={openAddForm}>
        <Icon name="plus" size={16} />
        <span class="ml-1.5">添加成员</span>
      </button>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-6">
    {#if $familyMembers.length === 0}
      <div class="h-full flex flex-col items-center justify-center py-20">
        <div class="w-20 h-20 rounded-full bg-medical-blue-50 flex items-center justify-center mb-4">
          <Icon name="users" size={40} color="#93C5FD" />
        </div>
        <p class="text-medical-text-secondary mb-4">暂无家庭成员</p>
        <button class="btn-primary" on:click={openAddForm}>
          <Icon name="plus" size={16} />
          <span class="ml-1.5">添加第一位成员</span>
        </button>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each $familyMembers as member (member.id)}
          <div class="card p-5 hover:shadow-cardHover transition-all duration-300">
            <div class="flex items-start gap-4">
              <div
                class="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                style="background-color: {member.color}20;"
              >
                {member.avatar}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <h3 class="text-lg font-semibold text-medical-text-primary truncate">{member.name}</h3>
                      <span class="tag bg-medical-blue-50 text-medical-blue-500">{member.relation}</span>
                      {#if getMemberAgeText(member)}
                        <span class="tag bg-purple-50 text-purple-500">{getMemberAgeText(member)}</span>
                      {/if}
                    </div>
                    <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                      {#if member.weight}
                        <span class="text-xs text-medical-text-tertiary">体重 {member.weight}kg</span>
                      {/if}
                      {#if member.liverFunction && member.liverFunction !== 'normal'}
                        <span class="tag {ORGAN_FUNCTION_COLORS[member.liverFunction]} text-xs">肝功 {ORGAN_FUNCTION_LABELS[member.liverFunction]}</span>
                      {/if}
                      {#if member.kidneyFunction && member.kidneyFunction !== 'normal'}
                        <span class="tag {ORGAN_FUNCTION_COLORS[member.kidneyFunction]} text-xs">肾功 {ORGAN_FUNCTION_LABELS[member.kidneyFunction]}</span>
                      {/if}
                    </div>
                  </div>
                  <div class="flex items-center gap-1 flex-shrink-0">
                    <button class="w-8 h-8 rounded-lg text-medical-text-secondary hover:bg-medical-blue-50 hover:text-medical-blue-500 transition-all" on:click={() => openEditForm(member)}>
                      <Icon name="edit" size={16} />
                    </button>
                    <button class="w-8 h-8 rounded-lg text-medical-text-secondary hover:bg-red-50 hover:text-medical-danger transition-all" on:click={() => requestDelete(member.id)}>
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </div>
                <div class="flex items-center gap-4 mt-3 pt-3 border-t border-medical-blue-50">
                  <div>
                    <p class="text-xs text-medical-text-tertiary">关联药品</p>
                    <p class="text-lg font-semibold text-medical-blue-500">{getMedicinesCount(member.id)}</p>
                  </div>
                  <div>
                    <p class="text-xs text-medical-text-tertiary">用药记录</p>
                    <p class="text-lg font-semibold text-medical-green-500">{getRecordsCount(member.id)}</p>
                  </div>
                  {#if member.birthDate}
                    <div>
                      <p class="text-xs text-medical-text-tertiary">生日</p>
                      <p class="text-sm font-medium text-medical-text-primary">{member.birthDate}</p>
                    </div>
                  {/if}
                </div>
                {#if getAllergyLabels(member).length > 0 || getChronicLabels(member).length > 0 || (member.longTermMedications && member.longTermMedications.length > 0)}
                  <div class="mt-3 pt-3 border-t border-medical-blue-50 space-y-2">
                    {#if getAllergyLabels(member).length > 0}
                      <div class="flex flex-wrap gap-1">
                        <span class="text-xs text-medical-text-tertiary flex-shrink-0">过敏：</span>
                        {#each getAllergyLabels(member) as a}
                          <span class="tag bg-red-50 text-medical-danger text-xs">{a}</span>
                        {/each}
                      </div>
                    {/if}
                    {#if getChronicLabels(member).length > 0}
                      <div class="flex flex-wrap gap-1">
                        <span class="text-xs text-medical-text-tertiary flex-shrink-0">慢病：</span>
                        {#each getChronicLabels(member) as d}
                          <span class="tag bg-amber-50 text-amber-600 text-xs">{d}</span>
                        {/each}
                      </div>
                    {/if}
                    {#if member.longTermMedications && member.longTermMedications.length > 0}
                      <div class="flex flex-wrap gap-1">
                        <span class="text-xs text-medical-text-tertiary flex-shrink-0">长服：</span>
                        {#each member.longTermMedications as m}
                          <span class="tag bg-medical-blue-50 text-medical-blue-500 text-xs">{m}</span>
                        {/each}
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<Modal show={showFormModal} title={editingMember ? '编辑成员' : '添加成员'} width="560px">
  <div class="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
    <div>
      <label class="label-base">选择头像</label>
      <div class="flex flex-wrap gap-2">
        {#each AVATARS as avatar}
          <button
            type="button"
            class="w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all {form.avatar === avatar ? 'bg-medical-blue-100 ring-2 ring-medical-blue-400' : 'bg-gray-50 hover:bg-medical-blue-50'}"
            on:click={() => { form.avatar = avatar; form = form }}
          >
            {avatar}
          </button>
        {/each}
      </div>
    </div>
    <div>
      <label class="label-base">选择颜色</label>
      <div class="flex flex-wrap gap-2">
        {#each COLORS as color}
          <button
            type="button"
            class="w-8 h-8 rounded-full transition-all"
            style="background-color: {color};"
            class:ring-2={form.color === color}
            class:ring-offset-2={form.color === color}
            on:click={() => { form.color = color; form = form }}
          ></button>
        {/each}
      </div>
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="label-base">姓名 <span class="text-medical-danger">*</span></label>
        <input type="text" class="input-base" placeholder="如：小明" bind:value={form.name} />
      </div>
      <div>
        <label class="label-base">关系</label>
        <select class="input-base" bind:value={form.relation}>
          {#each RELATIONS as r}
            <option value={r}>{r}</option>
          {/each}
        </select>
      </div>
      <div>
        <label class="label-base">出生日期</label>
        <input type="date" class="input-base" bind:value={form.birthDate} />
      </div>
      <div>
        <label class="label-base">体重（kg）</label>
        <input type="number" class="input-base" min="0" step="0.1" placeholder="如：60" bind:value={form.weight} />
      </div>
    </div>

    <div class="pt-4 border-t border-medical-blue-50">
      <p class="text-sm font-semibold text-medical-text-primary mb-3 flex items-center gap-1.5">
        <Icon name="alert" size={16} color="#EF4444" />
        药物过敏史
      </p>
      <div class="flex flex-wrap gap-2 mb-2">
        {#each ALLERGY_TYPES as type}
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg text-sm border-2 transition-all {form.allergies.includes(type.value) ? 'border-red-400 bg-red-50 text-medical-danger' : 'border-gray-200 text-medical-text-secondary hover:border-red-200 hover:bg-red-50/50'}"
            on:click={() => toggleAllergy(type.value)}
          >
            {type.label}
          </button>
        {/each}
      </div>
      {#if form.customAllergies && form.customAllergies.length > 0}
        <div class="flex flex-wrap gap-1.5 mb-2">
          {#each form.customAllergies as a, idx}
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-medical-danger text-sm border border-red-200">
              {a}
              <button type="button" class="hover:text-red-700" on:click={() => removeCustomAllergy(idx)}>
                <Icon name="close" size={12} />
              </button>
            </span>
          {/each}
        </div>
      {/if}
      <div class="flex gap-2">
        <input
          type="text"
          class="input-base flex-1"
          placeholder="自定义其他过敏原..."
          bind:value={customAllergyInput}
          on:keydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomAllergy(); } }}
        />
        <button type="button" class="btn-secondary" on:click={addCustomAllergy}>添加</button>
      </div>
    </div>

    <div class="pt-4 border-t border-medical-blue-50">
      <p class="text-sm font-semibold text-medical-text-primary mb-3 flex items-center gap-1.5">
        <Icon name="clock" size={16} color="#F59E0B" />
        慢性疾病
      </p>
      <div class="flex flex-wrap gap-2">
        {#each CHRONIC_DISEASES as disease}
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg text-sm border-2 transition-all {form.chronicDiseases.includes(disease.value) ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-gray-200 text-medical-text-secondary hover:border-amber-200 hover:bg-amber-50/50'}"
            on:click={() => toggleChronicDisease(disease.value)}
          >
            {disease.label}
          </button>
        {/each}
      </div>
    </div>

    <div class="pt-4 border-t border-medical-blue-50">
      <p class="text-sm font-semibold text-medical-text-primary mb-3 flex items-center gap-1.5">
        <Icon name="pill" size={16} color="#3B82F6" />
        长期服用药物
      </p>
      {#if form.longTermMedications && form.longTermMedications.length > 0}
        <div class="flex flex-wrap gap-1.5 mb-2">
          {#each form.longTermMedications as m, idx}
            <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-medical-blue-50 text-medical-blue-500 text-sm border border-medical-blue-200">
              {m}
              <button type="button" class="hover:text-blue-700" on:click={() => removeLongTermMed(idx)}>
                <Icon name="close" size={12} />
              </button>
            </span>
          {/each}
        </div>
      {/if}
      <div class="flex gap-2">
        <input
          type="text"
          class="input-base flex-1"
          placeholder="输入长期服用的药品名称..."
          bind:value={longTermMedInput}
          on:keydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLongTermMed(); } }}
        />
        <button type="button" class="btn-secondary" on:click={addLongTermMed}>添加</button>
      </div>
    </div>

    <div class="pt-4 border-t border-medical-blue-50">
      <p class="text-sm font-semibold text-medical-text-primary mb-3 flex items-center gap-1.5">
        <Icon name="shield" size={16} color="#10B981" />
        肝肾功能
      </p>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="label-base">肝功能</label>
          <select class="input-base" bind:value={form.liverFunction}>
            <option value={ORGAN_FUNCTION.NORMAL}>{ORGAN_FUNCTION_LABELS[ORGAN_FUNCTION.NORMAL]}</option>
            <option value={ORGAN_FUNCTION.MILD}>{ORGAN_FUNCTION_LABELS[ORGAN_FUNCTION.MILD]}</option>
            <option value={ORGAN_FUNCTION.SEVERE}>{ORGAN_FUNCTION_LABELS[ORGAN_FUNCTION.SEVERE]}</option>
          </select>
        </div>
        <div>
          <label class="label-base">肾功能</label>
          <select class="input-base" bind:value={form.kidneyFunction}>
            <option value={ORGAN_FUNCTION.NORMAL}>{ORGAN_FUNCTION_LABELS[ORGAN_FUNCTION.NORMAL]}</option>
            <option value={ORGAN_FUNCTION.MILD}>{ORGAN_FUNCTION_LABELS[ORGAN_FUNCTION.MILD]}</option>
            <option value={ORGAN_FUNCTION.SEVERE}>{ORGAN_FUNCTION_LABELS[ORGAN_FUNCTION.SEVERE]}</option>
          </select>
        </div>
      </div>
    </div>
  </div>
  <div slot="footer">
    <button class="btn-ghost" on:click={() => showFormModal = false}>取消</button>
    <button class="btn-primary" on:click={handleSubmit}>{editingMember ? '保存修改' : '添加成员'}</button>
  </div>
</Modal>

<Modal show={showDeleteConfirm} title="确认删除" width="400px" on:close={cancelDelete}>
  <div class="py-4">
    <div class="flex items-start gap-3">
      <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
        <Icon name="alert" size={20} color="#EF4444" />
      </div>
      <div>
        <p class="font-medium text-medical-text-primary">确定要删除此成员吗？</p>
        <p class="text-sm text-medical-text-secondary mt-1">删除后将无法恢复，相关药品关联将被移除。</p>
      </div>
    </div>
  </div>
  <div slot="footer">
    <button class="btn-ghost" on:click={cancelDelete}>取消</button>
    <button class="btn-danger" on:click={confirmDelete}>确认删除</button>
  </div>
</Modal>
