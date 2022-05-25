import * as React from "react";
import {
  PlasmicComponent,
  extractPlasmicQueryData,
  ComponentRenderData,
  PlasmicRootProvider,
} from "@plasmicapp/loader-nextjs";
import { GetStaticPaths, GetStaticProps } from "next";

import Error from "next/error";
import { PLASMIC } from "../plasmic-init";

export function getStrapiHost() {
  return process.env.STRAPI_HOST || "http://localhost:1337" ;
}

export default function PlasmicLoaderPage(props: {
  plasmicData?: ComponentRenderData;
  queryCache?: Record<string, any>;
}) {
  const { plasmicData, queryCache } = props;

  const [regimen, setRegimen] = React.useState<string | undefined>();

  if (!plasmicData || plasmicData.entryCompMetas.length === 0) {
    return <Error statusCode={404} />;
  }
  return (
    <PlasmicRootProvider
      loader={PLASMIC}
      prefetchedData={plasmicData}
      prefetchedQueryData={queryCache}
      globalContextsProps={{
        strapiCredentialsProviderProps: { host: getStrapiHost() }
      }}
    >
      <PlasmicComponent 
        component={plasmicData.entryCompMetas[0].name} 
        componentProps={{
          ...(regimen 
            ? { variables: { regimen } }
            : {}
          ),
          regimenNav: {
            regimenNavMenu: {
              regimen,
              onClick: (regimen: any) => setRegimen(regimen)
            }
          },
        }}
      />
    </PlasmicRootProvider>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const { catchall } = context.params ?? {};
  const plasmicData = await PLASMIC.maybeFetchComponentData("our-regimens");
  if (!plasmicData) {
    // non-Plasmic catch-all
    return { props: {} };
  }

  // Cache the necessary data fetched for the page
  const queryCache = await extractPlasmicQueryData(
    <PlasmicRootProvider 
    loader={PLASMIC} 
    prefetchedData={plasmicData}
    globalContextsProps={{
      strapiCredentialsProviderProps: { host: getStrapiHost() }
    }}
    >
      <PlasmicComponent component={plasmicData.entryCompMetas[0].name} />
    </PlasmicRootProvider>
  );
  // Use revalidate if you want incremental static regeneration
  return { props: { plasmicData, queryCache }, revalidate: 60 };
}