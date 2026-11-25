import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../../app/GameConfig';
import { getAccountLevel } from '../data/progression';
import { getAgentMission } from '../data/agents';
import { agentService } from '../systems/agents/AgentService';
import { saveService } from '../../persistence/SaveService';

export class HQInboxScene extends Phaser.Scene {
  private refreshTimer?: Phaser.Time.TimerEvent;

  constructor() { super('HQInbox'); }

  create(): void {
    this.drawBackground();
    this.add.text(64, 38, 'ЗАШИФРОВАННАЯ СВЯЗЬ', {
      fontSize: '28px', color: '#f0c16d', fontStyle: 'bold', letterSpacing: 2,
    });
    this.add.text(66, 82, 'ВХОДЯЩИЕ • СВОДКИ • ОПЕРАТИВНЫЕ ОТЧЁТЫ', {
      fontSize: '13px', color: '#aebdca', letterSpacing: 2,
    });
    this.button(1050, 34, 166, 46, 'В ШТАБ', 0x39495a, () => this.scene.start('HQ'));
    this.renderInbox();
    this.refreshTimer = this.time.addEvent({ delay: 1000, loop: true, callback: () => this.renderInbox() });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.refreshTimer?.remove(false));
  }

  private drawBackground(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0x0c131c, 0x14202c, 0x202e3a, 0x0b1119, 1);
    g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    g.lineStyle(1, 0x506174, 0.18);
    for (let x = 0; x < GAME_WIDTH; x += 64) g.lineBetween(x, 0, x, GAME_HEIGHT);
    for (let y = 0; y < GAME_HEIGHT; y += 64) g.lineBetween(0, y, GAME_WIDTH, y);
  }

  private renderInbox(): void {
    this.children.getByName('inbox-content')?.destroy(true);
    const content = this.add.container(0, 0).setName('inbox-content').setDepth(5);
    const save = saveService.load();
    const now = Date.now();
    const ready = save.agentMissions.filter((run) => run.completesAt <= now).length;
    content.add(this.add.rectangle(640, 138, 1130, 58, 0x192735, 1).setStrokeStyle(1, 0x63788a, 0.6));
    content.add(this.add.text(88, 119, 'СТАТУС КАНАЛА: ЗАЩИЩЁН', {
      fontSize: '14px', color: '#9ed2b0', fontStyle: 'bold',
    }));
    content.add(this.add.text(900, 119, 'ОТЧЁТОВ ГОТОВО: ' + ready, {
      fontSize: '14px', color: ready > 0 ? '#f0c16d' : '#aebdca', fontStyle: 'bold',
    }));

    content.add(this.add.text(88, 184, 'ОПЕРАТИВНЫЕ ЗАДАНИЯ', {
      fontSize: '17px', color: '#f0c16d', fontStyle: 'bold', letterSpacing: 1,
    }));
    if (save.agentMissions.length === 0) {
      content.add(this.add.rectangle(640, 300, 1130, 150, 0x17232e, 0.96).setStrokeStyle(1, 0x506174, 0.7));
      content.add(this.add.text(112, 252, 'НЕТ АКТИВНЫХ ПЕРЕХВАТОВ', {
        fontSize: '20px', color: '#e1e8ee', fontStyle: 'bold',
      }));
      content.add(this.add.text(112, 296,
        'Отправляйте оперативников на задания через компьютер агентства. Здесь появятся сроки,\nрезультаты и отчёты. Ваши люди работают. Иногда даже в рабочее время.',
        { fontSize: '15px', color: '#aebdca', lineSpacing: 8 }));
    } else {
      save.agentMissions.forEach((run, index) => {
        const mission = getAgentMission(run.missionId);
        if (!mission) return;
        const y = 220 + index * 116;
        const completed = run.completesAt <= now;
        const remaining = Math.max(0, run.completesAt - now);
        const seconds = Math.ceil(remaining / 1000);
        content.add(this.add.rectangle(640, y + 38, 1130, 94, 0x17232e, 0.98)
          .setStrokeStyle(1, completed ? 0x9d794e : 0x506174, 0.75));
        content.add(this.add.text(100, y + 8, mission.title, {
          fontSize: '16px', color: '#e1e8ee', fontStyle: 'bold',
        }));
        content.add(this.add.text(100, y + 38,
          completed ? 'ОТЧЁТ ГОТОВ • ' + run.agentIds.length + ' ОПЕРАТИВНИК(А)' :
            'В РАБОТЕ • ОСТАЛОСЬ ' + Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0'),
          { fontSize: '13px', color: completed ? '#f0c16d' : '#9ed2b0', fontStyle: 'bold' }));
        content.add(this.add.text(100, y + 62, mission.briefing, {
          fontSize: '12px', color: '#93a2af',
        }));
        if (completed) {
          const claim = this.add.rectangle(1080, y + 38, 190, 42, 0x8d3438, 1)
            .setStrokeStyle(1, 0xffffff, 0.25).setInteractive({ useHandCursor: true });
          const label = this.add.text(1080, y + 38, 'ПОЛУЧИТЬ ОТЧЁТ', {
            fontSize: '12px', color: '#ffffff', fontStyle: 'bold',
          }).setOrigin(0.5);
          claim.on('pointerdown', () => {
            const report = agentService.collectMission(run.id);
            if (report) {
              this.showToast(report.success
                ? 'ОТЧЁТ ПРИНЯТ • +' + report.componentsEarned + ' КОМПОНЕНТОВ'
                : 'ОТЧЁТ ПРИНЯТ • ОПЕРАЦИЯ ПРОВАЛЕНА');
              this.renderInbox();
            }
          });
          content.add([claim, label]);
        }
      });
    }

    content.add(this.add.rectangle(640, 590, 1130, 104, 0x111b25, 0.96).setStrokeStyle(1, 0x506174, 0.5));
    content.add(this.add.text(92, 548, 'СЛУЖЕБНАЯ ЗАПИСКА', {
      fontSize: '12px', color: '#d09b68', fontStyle: 'bold', letterSpacing: 1,
    }));
    content.add(this.add.text(92, 574,
      getAccountLevel(save.accountXp) >= 3
        ? 'Новые контракты и сообщения поступают по мере развития агентства. Следите за каналом.'
        : 'Отдел связи активирован. Контракты для оперативников откроются с 3-го уровня репутации.',
      { fontSize: '14px', color: '#c4ced7' }));
    const computer = this.add.text(92, 622, 'ОТКРЫТЬ КОМПЬЮТЕР АГЕНТСТВА →', {
      fontSize: '13px', color: '#f0c16d', fontStyle: 'bold',
    }).setInteractive({ useHandCursor: true });
    computer.on('pointerdown', () => this.scene.start('Computer'));
    content.add(computer);
  }

  private showToast(message: string): void {
    this.children.getByName('inbox-toast')?.destroy();
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 22, message, {
      fontSize: '14px', color: '#f0c16d', backgroundColor: '#101720ee',
      padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setName('inbox-toast').setDepth(20);
  }

  private button(x: number, y: number, width: number, height: number, label: string, color: number, action: () => void): void {
    const bg = this.add.rectangle(x + width / 2, y + height / 2, width, height, color, 1)
      .setStrokeStyle(1, 0xffffff, 0.25).setInteractive({ useHandCursor: true });
    this.add.text(x + width / 2, y + height / 2, label, {
      fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    bg.on('pointerover', () => bg.setAlpha(0.82));
    bg.on('pointerout', () => bg.setAlpha(1));
    bg.on('pointerdown', action);
  }
}
