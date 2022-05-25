import { usePlasmicQueryData } from "@plasmicapp/query";
import React from "react";
import { CredentialsContext, ensure } from "./strapi";
import L from "lodash";
import qs from "qs";

export default function RegimenColorTheme ({
  className,
  variables,
  type,
  children,
}: {
  className?: string,
  variables?: Record<string, string>,
  type?: string,
  children?: React.ReactNode
}) {
  const creds = ensure(React.useContext(CredentialsContext));

  const regimen = variables?.regimen ?? "";

  const dataKey = JSON.stringify({creds, regimen, type: "one-regimen"});
  const { data, error, isLoading } = usePlasmicQueryData<any | null>(dataKey, async () => {
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
    const query = {
      populate: {
        entries: {
          populate: "*",
          filters: {
            label: {
              $eq: regimen
            }
          }
        }
      }
    }
    return (await fetch(`${creds.host}/api/regimen-navs?${qs.stringify(query)}`, opts)).json();
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
  console.log("dale", "one-regimen", data);
  const colorTheme = L.get(data, ["data", 0, "attributes", "entries", 0, "regimen", "data", "attributes", "regimenColorTheme"]) ?? "#000000";

  const newStyle = type ? { [type]: colorTheme} : {}
  return React.isValidElement(children)
    ? React.cloneElement(children, {style: {...children.props.style, ...newStyle}})
    : null;
}