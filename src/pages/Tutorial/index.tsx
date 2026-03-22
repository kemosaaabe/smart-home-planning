import { type FC, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { TriangleAlert } from 'lucide-react';
import { Layout } from '@/widgets/layout';
import { RoomLayout, RoomsList } from '@/widgets/Room';
import {
  Breadcrumbs,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui';
import type { Room } from '@/entities/Room';
import {
  TutorialOverlay,
  tutorialSteps,
  tutorialStorageKeys,
  useTutorial,
} from '@/features/tutorial';
import styles from './styles.module.scss';

const breadcrumbs = [
  { label: 'Главная', href: '/' },
  { label: 'Обучающий режим' },
];

const trainingProjectId = 0;

export const TutorialPage: FC = () => {
  const [sessionId, setSessionId] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [hasRectangle, setHasRectangle] = useState(false);
  const [hasAddedFurniture, setHasAddedFurniture] = useState(false);
  const [hasAddedDevice, setHasAddedDevice] = useState(false);
  const [forcedTool, setForcedTool] = useState<'rectangle' | undefined>();
  const [openFurnitureSignal, setOpenFurnitureSignal] = useState(0);
  const [openDevicesSignal, setOpenDevicesSignal] = useState(0);

  const tutorial = useTutorial({
    steps: tutorialSteps,
    context: {
      hasRoom: rooms.length > 0,
      hasRectangle,
      hasAddedFurniture,
      hasAddedDevice,
    },
  });

  const createRoom = () => {
    if (isMobile) return;
    const trainingRoom: Room = {
      id: sessionId,
      name: 'Учебная комната',
      description: 'Только для практики',
      projectId: trainingProjectId,
      updatedAt: new Date().toISOString(),
    };
    setRooms([trainingRoom]);
    setSelectedRoomId(trainingRoom.id);
    tutorial.start(1);
  };

  const resetTraining = () => {
    setSessionId((prev) => prev + 1);
    setRooms([]);
    setSelectedRoomId(null);
    setHasRectangle(false);
    setHasAddedFurniture(false);
    setHasAddedDevice(false);
    setForcedTool(undefined);
    setOpenFurnitureSignal(0);
    setOpenDevicesSignal(0);
    tutorial.restart();
  };

  const activeRoomId = useMemo(
    () => (selectedRoomId ?? rooms[0]?.id ?? null),
    [selectedRoomId, rooms]
  );

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    const apply = () => setIsMobile(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (!tutorial.completedOpen) return;
    localStorage.setItem(tutorialStorageKeys.completed, 'true');
  }, [tutorial.completedOpen]);

  const currentStepId = tutorial.currentStep?.id;
  const progressText =
    currentStepId === 'create-room'
      ? 'Шаг 1 из 4'
      : currentStepId === 'create-rectangle'
      ? 'Шаг 2 из 4'
      : currentStepId === 'add-furniture'
      ? 'Шаг 3 из 4'
      : currentStepId === 'place-device'
      ? 'Шаг 4 из 4'
      : undefined;

  const nextLabel =
    currentStepId === 'create-room'
      ? 'Создать комнату'
      : currentStepId === 'create-rectangle'
      ? 'Создать'
      : currentStepId === 'add-furniture'
      ? 'Открыть мебель'
      : currentStepId === 'place-device'
      ? 'Открыть устройства'
      : 'Далее';

  const handleTutorialNext = () => {
    if (currentStepId === 'create-room') {
      createRoom();
    } else if (currentStepId === 'create-rectangle') {
      setForcedTool('rectangle');
    } else if (currentStepId === 'add-furniture') {
      setOpenFurnitureSignal((prev) => prev + 1);
    } else if (currentStepId === 'place-device') {
      setOpenDevicesSignal((prev) => prev + 1);
    }
    tutorial.next();
  };

  return (
    <Layout>
      <div className={styles.page}>
        <Breadcrumbs items={breadcrumbs} />
        <header className={styles.header}>
          <h1 className={styles.title}>Обучающий режим</h1>
          <p className={styles.subtitle}>
            Здесь можно потренироваться: создать комнату, добавить устройство и
            разместить его на полотне проектирования.
          </p>
          {rooms.length > 0 && (
            <div className={styles.topActions}>
              <Button variant="secondary" onClick={resetTraining}>
                Начать заново
              </Button>
            </div>
          )}
        </header>

        {isMobile ? (
          <div className={styles.mobileWarning} role="alert">
            <TriangleAlert className={styles.mobileWarningIcon} aria-hidden />
            <p className={styles.mobileWarningTitle}>
              Проектирование недоступно на мобильных устройствах
            </p>
            <p className={styles.mobileWarningText}>
              Для обучающего режима и работы с полотном используйте ПК или ноутбук.
            </p>
          </div>
        ) : rooms.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>
              Шаг 1. Сначала создай учебную комнату для тренировки.
            </p>
            <Button data-tutorial="tutorial-create-room" onClick={createRoom}>
              Создать комнату
            </Button>
          </div>
        ) : (
          <section className={styles.rooms}>
            <div className={styles.roomsCol}>
              <RoomsList
                rooms={rooms}
                projectId={trainingProjectId}
                selectedRoomId={activeRoomId}
                onSelectRoom={setSelectedRoomId}
              />
            </div>
            <RoomLayout
              roomId={activeRoomId}
              onRectangleCreated={() => setHasRectangle(true)}
              onFurnitureAdded={() => setHasAddedFurniture(true)}
              onDeviceAdded={() => setHasAddedDevice(true)}
              forcedTool={forcedTool}
              openFurnitureSignal={openFurnitureSignal}
              openDevicesSignal={openDevicesSignal}
            />
          </section>
        )}
      </div>

      <TutorialOverlay
        open={!isMobile && tutorial.open}
        step={tutorial.currentStep}
        stepIndex={tutorial.currentStepIndex}
        totalSteps={tutorial.totalSteps}
        progressText={progressText}
        canGoNext={tutorial.canGoNext}
        nextLabel={nextLabel}
        isFinish={tutorial.isFinish}
        onNext={handleTutorialNext}
        onClose={resetTraining}
      />

      <Dialog
        open={!isMobile && tutorial.completedOpen}
        onOpenChange={(value) => !value && tutorial.closeCompleted()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Вы ознакомились с базовым функционалом</DialogTitle>
            <DialogDescription>
              Отлично! Можно еще немного потренироваться в обучающем режиме или
              перейти в раздел проектов и создать полноценный проект.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={tutorial.closeCompleted}>
              Остаться и попробовать еще
            </Button>
            <Button asChild>
              <Link to="/projects" onClick={tutorial.closeCompleted}>
                Перейти в проекты
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};
