import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import CancelReservationButton from "~/app/_components/cancel-reservation-button";
import TutorCard from "~/app/_components/tutor-card";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";
import { api } from "~/trpc/server";
import { getInitials } from "~/utils/helpers";

import { reservations as reservationsTable } from "~/server/db/schema";
import Link from "next/link";

export default async function Page() {
  const session = await getServerAuthSession();

  const user = await api.users.getUserInfo.query();
  if (!user) {
    redirect("/404");
  }

  const tutors = await api.users.getAvailableTutors.query(); // TODO: filter reserved tutors
  const subjects = await api.subjects.getSubjects.query();
  const reservations = await api.reservations.getStudentReservations.query();
  const reservedTutorIds = reservations.map(
    (reservation) => reservation.tutorId,
  );
  const filteredTutors = tutors.filter(
    (tutor) => !reservedTutorIds.includes(tutor.id),
  );
  const threeFirst = filteredTutors.slice(0, 3);

  async function handleFastReservation(tutorId: string) {
    "use server";
    await api.reservations.addReservation.query({ tutorId: tutorId });
    revalidatePath("/dashboard/student");
    redirect("/dashboard/student");
  }

  async function handleReservatiuonCancel(reservationId: number) {
    "use server";
    await db
      .delete(reservationsTable)
      .where(eq(reservationsTable.id, reservationId));
    revalidatePath("/dashboard/student");
    redirect("/dashboard/student");
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-5xl font-extrabold">Sveiki, {user.name}!</h1>

      <div>
        <h2 className="mb-8 text-3xl font-bold">Rezervuotos pamokos</h2>
        <div className="flex gap-8">
          {reservations.map((reservation) => {
            const tutor = tutors.find(
              (tutor) => tutor.id === reservation.tutorId,
            );
            if (!tutor) return null;
            return (
              <div
                key={tutor.id}
                className="flex flex-col gap-2 border border-black p-4 shadow-sharp"
              >
                <div className="mb-8 flex items-center justify-center gap-4">
                  <div className="relative inline-flex h-[64px] w-[64px] items-center justify-center overflow-hidden rounded-full border border-black">
                    <span className="font-medium">
                      {getInitials(tutor.name)}
                    </span>
                  </div>
                  <p className="text-lg font-bold">{tutor.name}</p>
                </div>
                <div className="flex justify-between gap-2">
                  <p>Rezervacija patvirtinta:</p>
                  <p>{reservation.approved === 1 ? "Taip" : "Ne"}</p>
                </div>
                <div className="flex justify-between gap-2">
                  <p>El. paštas:</p>
                  <p>{tutor.email}</p>
                </div>
                <div className="flex justify-between gap-2">
                  <p>Telefono numeris:</p>
                  <p>{tutor.phoneNumber}</p>
                </div>
                <div className="flex justify-between gap-2">
                  <p>Valandos kaina:</p>
                  <p>{tutor.pricePerHour} Eur</p>
                </div>
                <CancelReservationButton
                  reservationId={reservation.id}
                  handleCancel={handleReservatiuonCancel}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-8 text-3xl font-bold">Greita Rezervacija</h2>
        <div className="grid gap-8 lg:grid-cols-3">
          {threeFirst.map((tutor) => (
            <div
              key={tutor.id}
              className="flex flex-col items-center justify-between gap-8 border border-black p-8 shadow-sharp"
            >
              <div className="flex items-center justify-center gap-4">
                <div className="relative inline-flex h-[64px] w-[64px] items-center justify-center overflow-hidden rounded-full border border-black">
                  <span className="font-medium">{getInitials(tutor.name)}</span>
                </div>
                <p className="text-lg font-bold">{tutor.name}</p>
              </div>

              <div>
                <div className="grid grid-cols-2">
                  <p className="text-sm font-bold">Dėsto:</p>
                  <p className="text-sm">
                    {tutor.subjects
                      .map((subject) => subjects[subject.subjectId - 1]?.name)
                      .join(", ")}
                  </p>
                </div>
                <div className="grid grid-cols-2">
                  <p className="text-sm font-bold">Kalbos:</p>
                  <p className="text-sm">
                    {tutor.languages
                      .map((language) => language.language)
                      .join(", ")}
                  </p>
                </div>
                <div className="grid grid-cols-2">
                  <p className="text-sm font-bold">Dėstymo vietos:</p>
                  <p className="text-sm">
                    {tutor.studyTypes.map((type) => type.studyType).join(", ")}
                  </p>
                </div>
                <div className="grid grid-cols-2">
                  <p className="text-sm font-bold">Valandos kaina:</p>
                  <p className="text-sm">{tutor.pricePerHour} Eur</p>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <p className="text-sm font-bold">Aprašymas:</p>
                <p className="text-sm">{tutor.description}</p>
              </div>

              <TutorCard
                handleFastReservation={handleFastReservation}
                tutorId={tutor.id}
              ></TutorCard>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-col items-center">
          <h2 className="mb-8 text-3xl font-bold">
            Not finding what you need?
          </h2>
          <Link
            className="border border-black px-16 py-6 shadow-sharp"
            href="/dashboard/student/filter"
          >
            Try advanced search
          </Link>
        </div>
      </div>
    </div>
  );
}
