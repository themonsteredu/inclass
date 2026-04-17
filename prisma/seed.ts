import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const adminPw = await bcrypt.hash("admin1234", 10);
  const studentPw = await bcrypt.hash("student1234", 10);

  await db.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      name: "관리자",
      passwordHash: adminPw,
      role: "ADMIN",
    },
  });
  await db.user.upsert({
    where: { username: "student1" },
    update: {},
    create: {
      username: "student1",
      name: "홍길동",
      passwordHash: studentPw,
      role: "STUDENT",
    },
  });
  await db.user.upsert({
    where: { username: "student2" },
    update: {},
    create: {
      username: "student2",
      name: "김영희",
      passwordHash: studentPw,
      role: "STUDENT",
    },
  });

  const wb = await db.workbook.upsert({
    where: { id: "seed-wb-1" },
    update: {},
    create: {
      id: "seed-wb-1",
      title: "수능 기출 모의고사 — 수학 Ⅰ",
      description: "예시 문제집입니다. 관리자로 로그인해서 자유롭게 수정하세요.",
      order: 0,
    },
  });

  for (let i = 1; i <= 3; i++) {
    await db.problem.upsert({
      where: { workbookId_number: { workbookId: wb.id, number: i } },
      update: {},
      create: {
        workbookId: wb.id,
        number: i,
        title: `예시 문제 ${i}`,
      },
    });
  }

  console.log("Seed complete.");
  console.log("  admin / admin1234");
  console.log("  student1 / student1234");
  console.log("  student2 / student1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
