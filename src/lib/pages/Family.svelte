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

  const AVATARS = ['👤', '👩', '👨', '👶', '👧', '👦', '👵', '👴', '🧑', '👨‍🦰', '👩‍🦰', '👨‍🦱']
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']
  const RELATIONS = ['本人', '配偶', '子女', '父母', '祖父母', '其他亲属']

  let showFormModal = false
  let editingMember = null

  let form = {
    name: '',
    avatar: '👤',
    color: COLORS[0],
    relation: '本人',
    birthDate: ''
  }

  function resetForm() {
    form = {
      name: '',
      avatar: '👤',
      color: COLORS[0],
      relation: '本人',
      birthDate: ''
    }
  }

  function openAddForm() {
    editingMember = null
    resetForm()
    showFormModal = true
  }

  function openEditForm(member) {
    editingMember = member
    form = { ...member }
    showFormModal = true
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

  function handleDelete(id) {
    if (confirm('确定删除此成员吗？相关药品关联将被移除。')) {
      deleteMember(id)
    }
  }

  function getMedicinesCount(memberId) {
    return $medicines.filter((m) => m.familyMemberIds?.includes(memberId)).length
  }

  function getRecordsCount(memberId) {
    return $medicationRecords.filter((r) => r.familyMemberId === memberId).length
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
                    <h3 class="text-lg font-semibold text-medical-text-primary truncate">{member.name}</h3>
                    <span class="tag bg-medical-blue-50 text-medical-blue-500 mt-1">{member.relation}</span>
                  </div>
                  <div class="flex items-center gap-1 flex-shrink-0">
                    <button class="w-8 h-8 rounded-lg text-medical-text-secondary hover:bg-medical-blue-50 hover:text-medical-blue-500 transition-all" on:click={() => openEditForm(member)}>
                      <Icon name="edit" size={16} />
                    </button>
                    <button class="w-8 h-8 rounded-lg text-medical-text-secondary hover:bg-red-50 hover:text-medical-danger transition-all" on:click={() => handleDelete(member.id)}>
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </div>
                <div class="flex items-center gap-4 mt-4 pt-4 border-t border-medical-blue-50">
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
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<Modal show={showFormModal} title={editingMember ? '编辑成员' : '添加成员'} width="480px">
  <div class="space-y-4">
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
  </div>
  <div slot="footer">
    <button class="btn-ghost" on:click={() => showFormModal = false}>取消</button>
    <button class="btn-primary" on:click={handleSubmit}>{editingMember ? '保存修改' : '添加成员'}</button>
  </div>
</Modal>
