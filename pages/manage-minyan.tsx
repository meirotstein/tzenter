import type { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import ManageMinyanConsole from "../components/manage-minyan/ManageMinyanConsole";

export default function ManageMinyanPage(
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) {
  return <ManageMinyanConsole {...props} />;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { getManageMinyanPageProps } = await import("../src/manage/pageProps");
  return getManageMinyanPageProps(context);
}
