import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { Button } from "@heroui/button";
import { Progress } from "@heroui/progress";
import { button as buttonStyles } from "@heroui/theme";
import {
  useQuery,
} from '@tanstack/react-query'

import { siteConfig } from "../config/site";
import { title, subtitle } from "../components/primitives";
import { GithubIcon } from "../components/icons";
import DefaultLayout from "../layouts/default";

function Status(){
  const {
    data
  } = useQuery({ queryKey: ['todos'], queryFn: async ()=>{
      const response = await fetch('/api/status');

      return response.json() as Promise<{percentage?: number}>

    },  refetchInterval: 1000, })

  return <>
    <Button color="primary">Button</Button>
    <Progress aria-label="Loading..." size="lg" value={data?.percentage* 100} />
    <p>Status: {JSON.stringify(data, null,2 )}</p>
  </>
}


export default function IndexPage() {
  return (
    <DefaultLayout>
      <Status/>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <span className={title()}>Make&nbsp;</span>
          <span className={title({ color: "violet" })}>beautiful&nbsp;</span>
          <br />
          <span className={title()}>
            websites regardless of your design experience.
          </span>
          <div className={subtitle({ class: "mt-4" })}>
            Beautiful, fast and modern React UI library.
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            isExternal
            className={buttonStyles({
              color: "primary",
              radius: "full",
              variant: "shadow",
            })}
            href={siteConfig.links.docs}
          >
            Documentation
          </Link>
          <Link
            isExternal
            className={buttonStyles({ variant: "bordered", radius: "full" })}
            href={siteConfig.links.github}
          >
            <GithubIcon size={20} />
            GitHub
          </Link>
        </div>

        <div className="mt-8">
          <Snippet hideCopyButton hideSymbol variant="bordered">
            <span>
              Get started by editing{" "}
              <Code color="primary">pages/index.tsx</Code>
            </span>
          </Snippet>
        </div>
      </section>
    </DefaultLayout>
  );
}
