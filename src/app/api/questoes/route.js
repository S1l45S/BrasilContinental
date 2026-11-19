
import { readFile } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      "src",
      "data",
      "questoes.json"
    );

    const content = await readFile(filePath, "utf8");

    return Response.json(JSON.parse(content));
  } catch (error) {
    return Response.json(
      { error: "Erro ao carregar questões." },
      { status: 500 }
    );
  }
}
