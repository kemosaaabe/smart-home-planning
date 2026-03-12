import { type FC, useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { getProjectBreadcrumbs, useProjectFormStore } from '@/widgets/Project';
import { ProjectSettings } from '@/features/Project';
import { RoomForm, useRoomFormStore } from '@/features/Room';
import { RoomsList, RoomLayout } from '@/widgets/Room';
import { Layout } from '@/widgets/layout';
import {
  getProjects,
  deleteProject as deleteProjectStorage,
} from '@/entities/Project';
import { deleteRoom, getRooms, type Room } from '@/entities/Room';
import {
  Breadcrumbs,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui';
import styles from './styles.module.scss';

export const ProjectPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = id != null ? Number(id) : NaN;
  const openForEdit = useProjectFormStore((s) => s.openForEdit);
  const projectsVersion = useProjectFormStore((s) => s.projectsVersion);
  const roomsVersion = useRoomFormStore((s) => s.roomsVersion);
  const openForCreateRoom = useRoomFormStore((s) => s.openForCreate);
  const roomFormOpen = useRoomFormStore((s) => s.isOpen);
  const setRoomFormOpen = useRoomFormStore((s) => s.setOpen);
  const editRoom = useRoomFormStore((s) => s.editRoom);
  const createProjectId = useRoomFormStore((s) => s.createProjectId);
  const bumpRoomsVersion = useRoomFormStore((s) => s.bumpRoomsVersion);
  const [optionsModalOpen, setOptionsModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  const project = useMemo(
    () => getProjects().find((p) => p.id === projectId),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- projectsVersion триггерит перечит. после сохранения
    [projectId, projectsVersion]
  );
  const projectName = project?.name ?? 'Проект';

  const rooms = useMemo(
    () => (Number.isFinite(projectId) ? getRooms(projectId) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectId, roomsVersion]
  );

  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  useEffect(() => {
    if (rooms.length > 0) {
      setSelectedRoomId((prev) =>
        prev !== null && rooms.some((r) => r.id === prev)
          ? prev
          : rooms[0].id
      );
    } else {
      setSelectedRoomId(null);
    }
  }, [rooms]);

  const activeRoom = useMemo(
    () => rooms.find((r) => r.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId]
  );

  const title = useMemo(
    () =>
      activeRoom ? `${projectName} - ${activeRoom.name}` : projectName,
    [projectName, activeRoom]
  );

  const breadcrumbs = useMemo(
    () => getProjectBreadcrumbs(projectName),
    [projectName]
  );

  const descriptionLine = useMemo(() => {
    const proj = project?.description?.trim();
    const room = activeRoom?.description?.trim();
    if (proj && room) return `${proj} / ${room}`;
    if (proj) return proj;
    if (room) return room;
    return null;
  }, [project?.description, activeRoom?.description]);

  const handleEditProject = () => {
    if (project) {
      setOptionsModalOpen(false);
      openForEdit(project);
    }
  };

  const handleDeleteClick = () => {
    setOptionsModalOpen(false);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (Number.isFinite(projectId) && deleteProjectStorage(projectId)) {
      setDeleteConfirmOpen(false);
      navigate('/projects');
    }
  };

  const handleDeleteRoomClick = (room: Room) => {
    setRoomToDelete(room);
  };

  const handleRoomDeleteConfirm = () => {
    if (roomToDelete && deleteRoom(roomToDelete.id)) {
      bumpRoomsVersion();
      setRoomToDelete(null);
    }
  };

  return (
    <Layout>
      <div className={styles.page}>
        <Breadcrumbs items={breadcrumbs} />
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.title}>{title}</h1>
              {descriptionLine != null && (
                <p className={styles.description}>{descriptionLine}</p>
              )}
            </div>
            {project != null && (
              <div className={styles.headerActions}>
                <button
                  type="button"
                  className={styles.settingsButton}
                  onClick={() => setOptionsModalOpen(true)}
                  aria-label="Настройки проекта"
                >
                  <Settings className={styles.settingsIcon} />
                </button>
              </div>
            )}
          </div>
        </div>

        <ProjectSettings
          open={optionsModalOpen}
          onOpenChange={setOptionsModalOpen}
          project={project ?? null}
          rooms={rooms}
          onEdit={handleEditProject}
          onDelete={handleDeleteClick}
          onDeleteRoom={handleDeleteRoomClick}
        />

        <RoomForm
          key={editRoom?.id ?? `create-${createProjectId ?? ''}`}
          open={roomFormOpen}
          onOpenChange={setRoomFormOpen}
          room={editRoom ?? null}
          projectId={createProjectId ?? undefined}
          onSaved={() => setOptionsModalOpen(false)}
        />

        <Dialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Удалить проект?</DialogTitle>
              <DialogDescription>
                Проект «{projectName}» и все связанные данные будут удалены. Это
                действие нельзя отменить.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setDeleteConfirmOpen(false)}
              >
                Отмена
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
              >
                Удалить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={roomToDelete != null}
          onOpenChange={(open) => !open && setRoomToDelete(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Удалить комнату?</DialogTitle>
              <DialogDescription>
                Комната «{roomToDelete?.name}» и все связанные данные будут
                удалены. Это действие нельзя отменить.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setRoomToDelete(null)}
              >
                Отмена
              </Button>
              <Button
                variant="destructive"
                onClick={handleRoomDeleteConfirm}
              >
                Удалить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <section
          className={
            rooms.length > 0 ? styles.rooms : styles.roomsEmpty
          }
        >
          <div className={styles.roomsCol}>
            <RoomsList
              rooms={rooms}
              projectId={projectId}
              selectedRoomId={selectedRoomId}
              onSelectRoom={setSelectedRoomId}
              onAddRoom={
                Number.isFinite(projectId)
                  ? () => openForCreateRoom(projectId)
                  : undefined
              }
            />
          </div>
          {rooms.length > 0 && (
              <RoomLayout
                projectId={projectId}
                roomId={selectedRoomId}
              />
            )}
        </section>
      </div>
    </Layout>
  );
};
