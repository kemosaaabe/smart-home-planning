import { type FC, useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getProjectBreadcrumbs } from '@/widgets/Project';
import { RoomsList, RoomLayout } from '@/widgets/Room';
import { Layout } from '@/widgets/layout';
import { getProjects } from '@/entities/Project';
import { getRooms } from '@/entities/Room';
import { Breadcrumbs } from '@/shared/ui';
import styles from './styles.module.scss';

export const ProjectPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = id != null ? Number(id) : NaN;
  const project = getProjects().find((p) => p.id === projectId);
  const projectName = project?.name ?? 'Проект';
  const rooms = useMemo(
    () => (Number.isFinite(projectId) ? getRooms(projectId) : []),
    [projectId]
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

  return (
    <Layout>
      <div className={styles.page}>
        <Breadcrumbs items={breadcrumbs} />
        <div className={styles.header}>
          <h1 className={styles.title}>{title}</h1>
          {descriptionLine != null && (
            <p className={styles.description}>{descriptionLine}</p>
          )}
        </div>
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
            />
          </div>
          {rooms.length > 0 && <RoomLayout projectId={projectId} />}
        </section>
      </div>
    </Layout>
  );
};
