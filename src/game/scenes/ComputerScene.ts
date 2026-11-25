import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../app/GameConfig';
import { AGENT_CANDIDATES, AGENT_MISSIONS, calculateAgentMissionChance, getAgentLevel, getAgentMissionSlots, type AgentMissionId } from '../data/agents';
import { BALANCE } from '../data/balance';
import { AGENCY_RESEARCH, type AgencyResearchId } from '../data/agencyResearch';
import { getAccountLevel } from '../data/progression';
import { agentService } from '../systems/agents/AgentService';
import { saveService, type UpgradeKind } from '../../persistence/SaveService';

type ComputerTab = 'upgrades' | 'agents' | 'research';

const UPGRADE_ROWS: Array<{ kind: UpgradeKind; label: string; description: string }> = [
  { kind: 'damage', label: 'УРОН', description: 'Повышает урон каждого попадания.' },
  { kind: 'magazine', label: 'ОБОЙМА', description: 'Увеличивает количество патронов в магазине.' },
  { kind: 'reload', label: 'ПЕРЕЗАРЯДКА', description: 'Сокращает время смены магазина.' },
  { kind: 'health', label: 'ЗДОРОВЬЕ', description: 'Увеличивает максимальное HP агента.' },
  { kind: 'armor', label: 'БРОНЕЖИЛЕТ', description: 'Снижает получаемый урон.' },
  { kind: 'precision', label: 'МЕТКОСТЬ', description: 'Увеличивает множитель попадания в голову.' },
];

export class ComputerScene extends Phaser.Scene {
  private tab: ComputerTab = 'upgrades';
  private content?: Phaser.GameObjects.Container;
  private selectedAgentIds: string[] = [];
  private notice = '';

  constructor() { super('Computer'); }

  create(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0x0c131c, 0x14202c, 0x202e3a, 0x0b1119, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.lineStyle(1, 0x506174, 0.18);
    for (let x = 0; x < GAME_WIDTH; x += 64) g.lineBetween(x, 0, x, GAME_HEIGHT);
    for (let y = 0; y < GAME_HEIGHT; y += 64) g.lineBetween(0, y, GAME_WIDTH, y);
    this.add.text(64, 32, 'КОМПЬЮТЕР АГЕНТСТВА', {
      fontSize: '28px', color: '#f0c16d', fontStyle: 'bold', letterSpacing: 2,
    });
    this.add.text(66, 78, 'СИСТЕМЫ УПРАВЛЕНИЯ И РАЗВИТИЯ', {
      fontSize: '13px', color: '#aebdca', letterSpacing: 2,
    });
    this.button(1050, 30, 166, 46, 'В ШТАБ', 0x39495a, () => this.scene.start('HQ'));
    this.button(64, 112, 250, 42, 'УЛУЧШЕНИЯ АГЕНТСТВА', 0x30495a, () => {
      this.tab = 'upgrades'; this.selectedAgentIds = []; this.render();
    });
    this.button(326, 112, 230, 42, 'ОТДЕЛ АГЕНТОВ', 0x30495a, () => {
      this.tab = 'agents'; this.selectedAgentIds = []; this.render();
    });
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => { if (this.tab === 'agents') this.render(); },
    });
    this.render();
  }

  private render(): void {
    this.content?.destroy(true);
    this.content = this.add.container(0, 0).setDepth(10);
    const save = saveService.load();
    if (this.notice) {
      this.addText(this.content, 64, 690, this.notice, 12, '#f0c16d');
    }
    if (this.tab === 'upgrades') this.renderUpgrades(save);
    else this.renderAgents(save);
  }

  private renderUpgrades(save: ReturnType<typeof saveService.load>): void {
    this.addText(this.content!, 64, 166, 'ПОСТОЯННЫЕ УЛУЧШЕНИЯ • ОПЛАТА ДОЛЛАРАМИ', 14, '#aebdca', true);
    this.addText(this.content!, 970, 164, 'БАЛАНС  $' + save.dollars.toLocaleString('ru-RU'), 18, '#86d2a2', true);
    UPGRADE_ROWS.forEach(({ kind, label, description }, index) => {
      const column = index % 3;
      const row = Math.floor(index / 3);
      const x = 64 + column * 390;
      const y = 204 + row * 218;
      const width = 360;
      const height = 190;
      const card = this.add.graphics();
      card.fillStyle(0x192633, 0.98);
      card.fillRoundedRect(x, y, width, height, 10);
      card.lineStyle(1, 0x536273, 0.8);
      card.strokeRoundedRect(x, y, width, height, 10);
      this.content!.add(card);

      const level = save.upgrades[kind];
      const costs = BALANCE.upgradeCosts[kind];
      const next = level + 1;
      const maxed = next >= costs.length;
      const requiredLevel = BALANCE.upgradeTierUnlockLevels[kind][next] ?? 1;
      const cost = maxed ? 0 : costs[next] ?? 0;
      const available = !maxed && getAccountLevel(save.accountXp) >= requiredLevel && save.dollars >= cost;
      this.addText(this.content!, x + 18, y + 16, label, 18, '#f1f4f7', true);
      this.addText(this.content!, x + 18, y + 52, 'ТЕКУЩИЙ УРОВЕНЬ  ' + level + '/4', 13, '#f0c16d');
      this.addText(this.content!, x + 18, y + 82, this.upgradeValue(kind, level), 17, '#ffffff', true);
      this.addText(this.content!, x + 18, y + 111, description, 11, '#99a8b5');
      const state = maxed ? 'МАКСИМУМ'
        : getAccountLevel(save.accountXp) < requiredLevel ? 'ОТКРОЕТСЯ НА УР. ' + requiredLevel
          : 'СЛЕДУЮЩИЙ УРОВЕНЬ  •  $' + cost.toLocaleString('ru-RU');
      this.addText(this.content!, x + 18, y + 145, state, 11, maxed ? '#80c99b' : '#d5bd91', true);
      if (!maxed) {
        this.drawButton(this.content!, x + 242, y + 138, 100, 36,
          available ? 'КУПИТЬ' : 'НЕДОСТУПНО', available ? 0x397d60 : 0x394552,
          () => this.buyUpgrade(kind));
      }
    });
    this.addText(this.content!, 64, 650,
      'ДОЛЛАРЫ РАСХОДУЮТСЯ • ОПЫТ АККАУНТА НЕ ТРАТИТСЯ И ПРОДОЛЖАЕТ ОТКРЫВАТЬ РАНГИ',
      12, '#718091');
  }

  private renderResearch(save: ReturnType<typeof saveService.load>): void {
    const level = getAccountLevel(save.accountXp);
    this.addText(this.content!, 64, 164, 'ИНФРАСТРУКТУРА И ДОКТРИНЫ • ОПЛАТА КОМПОНЕНТАМИ', 14, '#aebdca', true);
    this.addText(this.content!, 930, 164, 'КОМПОНЕНТЫ  ' + save.components.toLocaleString('ru-RU'), 17, '#86d2a2', true);
    if (level < 3) {
      this.drawPanel(this.content!, 64, 210, 1150, 380, 'ИССЛЕДОВАТЕЛЬСКИЙ ОТДЕЛ НЕ АКТИВИРОВАН');
      this.addText(this.content!, 100, 290, 'Исследования откроются на 3-м уровне агентства.\nСначала заслужите доступ к оперативному отделу.', 20, '#c2ccd6');
      this.addText(this.content!, 100, 390, 'ТРЕБУЕТСЯ: УРОВЕНЬ 3', 14, '#f0c16d', true);
      return;
    }
    AGENCY_RESEARCH.forEach((item, index) => {
      const x = 64 + index * 390;
      const y = 218;
      const current = save.agencyResearch[item.id];
      const max = item.costs.length - 1;
      const next = current + 1;
      const cost = item.costs[next] ?? 0;
      const maxed = current >= max;
      const canBuy = !maxed && save.components >= cost;
      const panel = this.add.graphics();
      panel.fillStyle(0x192633, 0.98);
      panel.fillRoundedRect(x, y, 360, 360, 10);
      panel.lineStyle(1, 0x8b704b, 0.75);
      panel.strokeRoundedRect(x, y, 360, 360, 10);
      this.content!.add(panel);
      this.addText(this.content!, x + 20, y + 24, item.title, 16, '#f0c16d', true);
      this.addText(this.content!, x + 20, y + 78, item.description, 13, '#c2ccd6');
      this.addText(this.content!, x + 20, y + 166, 'УРОВЕНЬ ' + current + '/' + max, 18, '#ffffff', true);
      this.addText(this.content!, x + 20, y + 204, 'ТЕКУЩИЙ ЭФФЕКТ', 10, '#8799a8', true);
      this.addText(this.content!, x + 20, y + 228, item.effect(current), 14, '#86d2a2', true);
      this.addText(this.content!, x + 20, y + 266, maxed ? 'ВСЕ ЭТАПЫ ЗАВЕРШЕНЫ' : 'СЛЕДУЮЩИЙ ЭТАП: ' + cost + ' КОМП.', 11, '#d5bd91', true);
      this.drawButton(this.content!, x + 20, y + 306, 320, 38,
        maxed ? 'ИССЛЕДОВАНИЕ ЗАВЕРШЕНО' : canBuy ? 'ЗАПУСТИТЬ ИССЛЕДОВАНИЕ' : 'НЕДОСТАТОЧНО КОМПОНЕНТОВ',
        canBuy ? 0x397d60 : 0x394552, () => this.buyResearch(item.id));
    });
    this.addText(this.content!, 64, 626,
      'ЭФФЕКТЫ ПРИМЕНЯЮТСЯ К НОВЫМ ОПЕРАЦИЯМ • УЖЕ ОТПРАВЛЕННЫЕ ОТРЯДЫ НЕ ПЕРЕСЧИТЫВАЮТСЯ',
      11, '#718091');
  }

  private buyResearch(id: AgencyResearchId): void {
    const result = saveService.purchaseAgencyResearch(id);
    this.notice = result.success ? 'ИССЛЕДОВАНИЕ ЗАВЕРШЕНО • ЭФФЕКТ АКТИВИРОВАН'
      : result.reason === 'components' ? 'НЕДОСТАТОЧНО КОМПОНЕНТОВ'
        : result.reason === 'locked' ? 'ТРЕБУЕТСЯ 3-Й УРОВЕНЬ АГЕНТСТВА' : 'ИССЛЕДОВАНИЕ УЖЕ ЗАВЕРШЕНО';
    this.render();
  }

  private renderAgents(save: ReturnType<typeof saveService.load>): void {
    const accountLevel = getAccountLevel(save.accountXp);
    const slotLimit = getAgentMissionSlots(accountLevel);
    const busyIds = new Set(save.agentMissions.flatMap((run) => run.agentIds));
    const availableAgents = save.agents.filter((agent) => !busyIds.has(agent.id));
    this.addText(this.content!, 64, 162, 'ОТДЕЛ ОПЕРАТИВНИКОВ', 17, '#f0c16d', true);
    this.addText(this.content!, 850, 163,
      'КОМПЛЕКТУЮЩИЕ  ' + save.components.toLocaleString('ru-RU') + '  •  ОПЕРАЦИИ  '
        + save.agentMissions.length + '/' + slotLimit,
      14, '#86d2a2', true);

    if (accountLevel < 3) {
      this.drawPanel(this.content!, 64, 210, 1150, 390, 'СИСТЕМА АГЕНТОВ ЗАБЛОКИРОВАНА');
      this.addText(this.content!, 100, 290,
        'Отдел агентов откроется на 3-м уровне аккаунта.\nДо этого агент работает один и лично выполняет основные операции.',
        21, '#c2ccd6');
      this.addText(this.content!, 100, 390, 'ТРЕБУЕТСЯ: УРОВЕНЬ 3', 14, '#f0c16d', true);
      return;
    }

    this.drawPanel(this.content!, 64, 202, 360, 460, 'РОСТЕР И НАБОР');
    this.addText(this.content!, 82, 238, 'ВАША КОМАНДА', 12, '#aebdca', true);
    save.agents.forEach((agent, index) => {
      const candidate = AGENT_CANDIDATES.find((item) => item.id === agent.id);
      if (!candidate) return;
      const y = 264 + index * 54;
      this.addText(this.content!, 82, y, candidate.codename + '  •  УР. ' + getAgentLevel(agent.xp), 13, '#f1f4f7', true);
      this.addText(this.content!, 82, y + 21,
        busyIds.has(agent.id) ? 'НА ЗАДАНИИ' : candidate.name + '  /  ' + this.roleName(candidate.role),
        10, busyIds.has(agent.id) ? '#d7a66b' : '#91a2b1');
      if (!busyIds.has(agent.id)) {
        const selected = this.selectedAgentIds.includes(agent.id);
        this.drawButton(this.content!, 322, y - 2, 82, 36, selected ? 'УБРАТЬ' : 'В ОТРЯД',
          selected ? 0x7b4246 : 0x315e4d, () => this.toggleAgentSelection(agent.id));
      }
    });

    const candidates = AGENT_CANDIDATES.filter((candidate) =>
      !save.agents.some((agent) => agent.id === candidate.id));
    this.addText(this.content!, 82, 492, 'КАНДИДАТЫ НА ВЕРБОВКУ', 12, '#aebdca', true);
    candidates.slice(0, 4).forEach((candidate, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = 80 + col * 170;
      const y = 520 + row * 64;
      const unlocked = accountLevel >= candidate.unlockLevel;
      this.addText(this.content!, x, y, candidate.codename, 11, unlocked ? '#e8edf2' : '#788592', true);
      this.addText(this.content!, x, y + 18, unlocked ? '$' + candidate.recruitCost : 'УР. ' + candidate.unlockLevel,
        10, unlocked ? '#d9c09a' : '#b47c78');
      this.drawButton(this.content!, x + 78, y + 4, 82, 32,
        unlocked ? 'НАНЯТЬ' : 'ЗАКРЫТО', unlocked && save.dollars >= candidate.recruitCost ? 0x397d60 : 0x394552,
        () => this.recruit(candidate.id));
    });

    this.drawPanel(this.content!, 444, 202, 770, 460, 'ОПЕРАЦИИ БРАТСТВА');
    this.addText(this.content!, 462, 238,
      'Выберите оперативников слева, затем отправьте их на отдельное задание. Сюжет не затрагивается.',
      11, '#98a7b4');

    const runs = save.agentMissions;
    if (runs.length > 0) {
      runs.forEach((run, index) => {
        const mission = AGENT_MISSIONS.find((entry) => entry.id === run.missionId);
        if (!mission) return;
        const x = 462 + index * 242;
        const y = 263;
        this.addText(this.content!, x, y, mission.title, 11, '#f0c16d', true);
        const remaining = run.completesAt - Date.now();
        if (remaining > 0) {
          this.addText(this.content!, x, y + 27, 'ВОЗВРАЩЕНИЕ ЧЕРЕЗ ' + this.formatTime(remaining), 11, '#d5dee7');
          this.addText(this.content!, x, y + 49, 'ОТРЯД: ' + run.agentIds.map((id) =>
            AGENT_CANDIDATES.find((candidate) => candidate.id === id)?.codename ?? id).join(', '), 9, '#91a2b1');
        } else {
          this.addText(this.content!, x, y + 27, 'ОПЕРАЦИЯ ЗАВЕРШЕНА', 11, '#83d7a4', true);
          this.drawButton(this.content!, x, y + 50, 205, 34, 'ЗАБРАТЬ РЕЗУЛЬТАТ', 0x397d60,
            () => this.collectMission(run.id));
        }
      });
    } else {
      this.addText(this.content!, 462, 270, 'СЕЙЧАС ВСЕ АГЕНТЫ В ШТАБЕ', 12, '#91a2b1');
    }

    const teamY = runs.length > 0 ? 355 : 320;
    const selectedNames = this.selectedAgentIds.map((id) =>
      AGENT_CANDIDATES.find((candidate) => candidate.id === id)?.codename ?? id);
    this.addText(this.content!, 462, teamY, 'ВЫБРАННЫЙ ОТРЯД: ' + (selectedNames.join(' • ') || 'НЕ СОБРАН'), 12, '#f0c16d', true);
    this.addText(this.content!, 462, teamY + 22,
      'Свободно: ' + availableAgents.length + ' • Успех зависит от уровня, специализации и состава.',
      10, '#91a2b1');

    const missionY = teamY + 58;
    AGENT_MISSIONS.forEach((mission, index) => {
      const x = 462 + index * 238;
      const unlocked = accountLevel >= mission.unlockLevel;
      const team = this.selectedAgentIds.map((id) => save.agents.find((agent) => agent.id === id))
        .filter((agent): agent is NonNullable<typeof agent> => Boolean(agent));
      const chance = unlocked ? calculateAgentMissionChance(mission, team) : 0;
      const slotAvailable = runs.length < slotLimit;
      const validTeam = team.length >= mission.minimumAgents && team.length <= mission.maximumAgents
        && team.length === this.selectedAgentIds.length;
      this.addText(this.content!, x, missionY, mission.title, 11, unlocked ? '#f1f4f7' : '#788592', true);
      this.addText(this.content!, x, missionY + 25, unlocked
        ? mission.briefing : 'ОТКРОЕТСЯ НА УРОВНЕ ' + mission.unlockLevel, 9, '#91a2b1');
      this.addText(this.content!, x, missionY + 62,
        'ОТРЯД: ' + mission.minimumAgents + '–' + mission.maximumAgents + ' • '
          + Math.round(mission.durationMs / 60_000) + ' МИН.',
        9, unlocked ? '#d5dee7' : '#788592');
      this.addText(this.content!, x, missionY + 84,
        'НАГРАДА: +' + mission.componentReward + ' ДЕТАЛЕЙ', 9, '#86d2a2', true);
      this.addText(this.content!, x, missionY + 106,
        unlocked ? 'ШАНС УСПЕХА: ' + (validTeam ? chance + '%' : 'СОБЕРИТЕ ОТРЯД') : 'ЗАДАНИЕ ЗАБЛОКИРОВАНО',
        9, validTeam && chance >= 60 ? '#83d7a4' : '#d7a66b', true);
      const canDispatch = unlocked && validTeam && slotAvailable && runs.length < slotLimit;
      this.drawButton(this.content!, x, missionY + 132, 205, 36,
        canDispatch ? 'ОТПРАВИТЬ' : 'НЕДОСТУПНО', canDispatch ? 0x9d3038 : 0x394552,
        () => this.dispatchMission(mission.id));
    });
  }

  private drawPanel(container: Phaser.GameObjects.Container, x: number, y: number, width: number, height: number, title: string): void {
    const panel = this.add.graphics();
    panel.fillStyle(0x192633, 0.97); panel.fillRoundedRect(x, y, width, height, 10);
    panel.lineStyle(1, 0x536273, 0.8); panel.strokeRoundedRect(x, y, width, height, 10);
    container.add(panel);
    this.addText(container, x + 18, y + 14, title, 13, '#aebdca', true);
  }

  private addText(
    container: Phaser.GameObjects.Container, x: number, y: number, value: string,
    size: number, color: string, bold = false,
  ): Phaser.GameObjects.Text {
    const text = this.add.text(x, y, value, {
      fontSize: size + 'px', color, fontStyle: bold ? 'bold' : 'normal',
      wordWrap: { width: 210 },
    });
    container.add(text);
    return text;
  }

  private drawButton(
    container: Phaser.GameObjects.Container, x: number, y: number, width: number, height: number,
    label: string, color: number, action: () => void,
  ): void {
    const button = this.add.rectangle(x + width / 2, y + height / 2, width, height, color)
      .setStrokeStyle(1, 0xffffff, 0.22).setInteractive({ useHandCursor: true });
    const text = this.add.text(x + width / 2, y + height / 2, label, {
      fontSize: '10px', color: '#fff', fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5);
    container.add([button, text]);
    button.on('pointerdown', action);
  }

  private buyUpgrade(kind: UpgradeKind): void {
    const result = saveService.purchaseUpgrade(kind);
    this.notice = result.success ? 'УЛУЧШЕНИЕ ПРИОБРЕТЕНО' : result.reason === 'funds'
      ? 'НЕДОСТАТОЧНО ДОЛЛАРОВ' : result.reason === 'level'
        ? 'ТРЕБУЕТСЯ БОЛЕЕ ВЫСОКИЙ УРОВЕНЬ' : 'УЛУЧШЕНИЕ УЖЕ МАКСИМАЛЬНОЕ';
    this.render();
  }

  private upgradeValue(kind: UpgradeKind, level: number): string {
    switch (kind) {
      case 'damage': return BALANCE.weapon.damage[level] + ' УРОНА';
      case 'magazine': return BALANCE.weapon.magazine[level] + ' ПАТРОНОВ';
      case 'reload': return BALANCE.weapon.reloadSeconds[level].toFixed(2) + ' СЕК';
      case 'health': return BALANCE.player.maxHp[level] + ' HP';
      case 'armor': return Math.round(BALANCE.player.damageReduction[level] * 100) + '% ЗАЩИТЫ';
      case 'precision': return '×' + BALANCE.weapon.headMultiplier[level].toFixed(2) + ' В ГОЛОВУ';
    }
  }

  private toggleAgentSelection(id: string): void {
    const available = agentService.getAvailableAgents().some((agent) => agent.id === id);
    if (!available) return;
    this.selectedAgentIds = this.selectedAgentIds.includes(id)
      ? this.selectedAgentIds.filter((item) => item !== id)
      : [...this.selectedAgentIds, id];
    this.render();
  }

  private recruit(id: string): void {
    const result = agentService.recruit(id);
    this.notice = result.success ? 'АГЕНТ ПРИНЯТ В БРАТСТВО'
      : result.reason === 'funds' ? 'НЕДОСТАТОЧНО ДОЛЛАРОВ ДЛЯ ВЕРБОВКИ'
        : result.reason === 'locked' ? 'АГЕНТ ПОКА НЕДОСТУПЕН ПО РАНГУ'
          : result.reason === 'already-recruited' ? 'АГЕНТ УЖЕ В КОМАНДЕ' : 'КАНДИДАТ НЕ НАЙДЕН';
    this.render();
  }

  private dispatchMission(missionId: AgentMissionId): void {
    const result = agentService.dispatch(missionId, this.selectedAgentIds);
    if (result.success) {
      this.selectedAgentIds = [];
      this.notice = 'ОТРЯД ОТПРАВЛЕН • ШАНС УСПЕХА ' + result.successChance + '%';
    } else {
      this.notice = result.reason === 'slots' ? 'НЕТ СВОБОДНЫХ СЛОТОВ ОПЕРАЦИЙ'
        : result.reason === 'busy' ? 'КТО-ТО ИЗ АГЕНТОВ УЖЕ НА ЗАДАНИИ'
          : result.reason === 'team-size' ? 'НЕВЕРНЫЙ СОСТАВ ОТРЯДА'
            : result.reason === 'locked' ? 'ОПЕРАЦИЯ ПОКА ЗАБЛОКИРОВАНА' : 'НЕ УДАЛОСЬ ОТПРАВИТЬ ОТРЯД';
    }
    this.render();
  }

  private collectMission(runId: string): void {
    const report = agentService.collectMission(runId);
    if (!report) {
      this.notice = 'ОПЕРАЦИЯ ЕЩЁ НЕ ЗАВЕРШЕНА';
    } else {
      this.notice = report.success
        ? 'УСПЕХ • +' + report.componentsEarned + ' ДЕТАЛЕЙ • АГЕНТЫ ПОЛУЧИЛИ +' + report.agentXpEarned + ' XP'
        : 'ПРОВАЛ • ДЕТАЛИ НЕ ПОЛУЧЕНЫ, НО АГЕНТЫ ПОЛУЧИЛИ ОПЫТ';
    }
    this.render();
  }

  private roleName(role: string): string {
    switch (role) {
      case 'scout': return 'РАЗВЕДЧИК';
      case 'engineer': return 'ТЕХНИК';
      case 'infiltrator': return 'ДИВЕРСАНТ';
      case 'assault': return 'ШТУРМОВИК';
      default: return role.toUpperCase();
    }
  }

  private formatTime(milliseconds: number): string {
    const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const minutes = Math.floor(seconds / 60);
    return minutes + ':' + String(seconds % 60).padStart(2, '0');
  }

  private button(x: number, y: number, width: number, height: number, label: string, color: number, action: () => void): void {
    const button = this.add.rectangle(x + width / 2, y + height / 2, width, height, color)
      .setStrokeStyle(1, 0xffffff, 0.24).setInteractive({ useHandCursor: true });
    this.add.text(x + width / 2, y + height / 2, label, {
      fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    button.on('pointerdown', action);
  }
}
