import { usePlasmicQueryData } from "@plasmicapp/query";
import React from "react";
import { CredentialsContext, ensure } from "./strapi";
import L from "lodash";
import { DataProvider, repeatedElement } from "@plasmicapp/host";
export default function RegimenNavMenu ({
  className,
  activeRegimen,
  nonActiveRegimen,
  regimen,
  onClick,
}: {
  className?: string,
  activeRegimen?: React.ReactNode,
  nonActiveRegimen?: React.ReactNode,
  regimen?: string,
  onClick?: (regimen: string) => void,
}) {
  const creds = ensure(React.useContext(CredentialsContext));

  const dataKey = JSON.stringify({creds, type: "all-regimens"});
  const { data, error, isLoading } = usePlasmicQueryData<any[] | null>(dataKey, async () => {
    if (!creds.host) {
      return null;
    }
    const opts: Record<string, any> = {
      method: "GET"
    };
    if (creds.token) {
      opts.headers = {
        "Authorization": `Bearer ${creds.token}`
      };
    }
    return (await fetch(`${creds.host}/api/regimen-navs?populate=*`, opts)).json();
  });

  if (!creds.host) {
    return <div className={className}>Please specify a Strapi host and token.</div>;
  }
  if (error) {
    return <div className={className}>Error fetching Strapi collection.</div>
  }
  if (isLoading) {
    return null;
  }

  const regimens = L.get(data, ["data", "0", "attributes", "entries"]) as any[];

  const activeRegimenIndex = Math.max(0, regimens.findIndex(_regimen => _regimen.label === regimen));
  const primaryNonActiveRegimenIndex = activeRegimenIndex > 0 ? 0 : 1;

  const attachOnClick = (elt: React.ReactNode, regimen: any) => 
    React.isValidElement(elt)
      ? React.cloneElement(elt, {
          onClick: () => {
            console.log("dale", onClick);
            if (typeof elt.props.onClick === "function") {
              elt.props.onClick();
            }
            onClick?.(regimen.label)
          }
        })
      : null;
  
  return <>
    {regimens.map((regimen, i) => 
      <DataProvider key={regimen.id} data={regimen} name={"strapiItem"}>
      {activeRegimenIndex === i
        ? attachOnClick(activeRegimen, regimen)
        : repeatedElement(
          primaryNonActiveRegimenIndex === i,
          attachOnClick(nonActiveRegimen, regimen)
       )
      }
      </DataProvider>
    )}
  </>
}