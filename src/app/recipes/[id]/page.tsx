import RecipeDetailWrapper from "./RecipeDetailWrapper";

interface RecipePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { id } = await params;

  return <RecipeDetailWrapper id={id} />;
}
