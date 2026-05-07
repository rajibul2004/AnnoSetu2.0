

export async function POST(req: Request) {
  const body = await req.json();
  console.log("Hi")

  // const user = await prisma.user.create({
  //   data: {
  //     email: body.email,
  //     name: body.name,
  //   },
  // });

  // return Response.json(user);
  // return Response.json();
}

``