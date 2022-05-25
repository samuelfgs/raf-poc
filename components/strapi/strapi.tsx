/** @format */

import {
  ComponentMeta,
  DataProvider,
  GlobalContextMeta,
  repeatedElement,
  useSelector,
} from "@plasmicapp/host";
import { usePlasmicQueryData } from "@plasmicapp/query";
import L from "lodash";
import qs from "qs";
import React, { ReactNode, useContext } from "react";

export function ensure<T>(x: T | null | undefined): T {
  if (x === null || x === undefined) {
    debugger;
    throw new Error(`Value must not be undefined or null`);
  } else {
    return x;
  }
}

const modulePath = "@plasmicpkgs/plasmic-strapi";

interface StrapiCredentialsProviderProps {
  host?: string;
  token?: string;
}

export const CredentialsContext = React.createContext<
  StrapiCredentialsProviderProps | undefined
>(undefined);

export const strapiCredentialsProviderMeta: GlobalContextMeta<StrapiCredentialsProviderProps> =
  {
    name: "StrapiCredentialsProvider2",
    displayName: "Strapi Credentials Provider",
    description:
      "API token is needed only if data is not publicly readable. Learn how to [get your API token](https://docs.strapi.io/user-docs/latest/settings/managing-global-settings.html#managing-api-tokens).",
    importName: "StrapiCredentialsProvider",
    importPath: modulePath,
    props: {
      host: {
        type: "string",
        displayName: "Host",
        defaultValueHint: "https://strapi-plasmic.herokuapp.com",
        defaultValue: "https://strapi-plasmic.herokuapp.com",
        description: "Server where you application is hosted.",
      },
      token: {
        type: "string",
        displayName: "API Token",
        description:
          "API Token (generated in http://yourhost/admin/settings/api-tokens) (or leave blank for unauthenticated usage).",
      },
    },
  };

export function StrapiCredentialsProvider({
  host,
  token,
  children,
}: React.PropsWithChildren<StrapiCredentialsProviderProps>) {
  console.log(`StrapiCredentialsProvider: strapi host is ${host}`)
  host = host?.slice(-1) === "/" ? host.slice(0, -1) : host;
  return (
    <CredentialsContext.Provider value={{ host, token }}>
      {children}
    </CredentialsContext.Provider>
  );
}

interface StrapiCollectionProps {
  name?: string;
  children?: ReactNode;
  className?: string;
  noLayout?: boolean;
  variables?: Record<string, string>;
  filter?: Record<string, any>;
}

export const strapiCollectionMeta: ComponentMeta<StrapiCollectionProps> = {
  name: "StrapiCollection2",
  displayName: "Strapi Collection",
  importName: "StrapiCollection",
  importPath: modulePath,
  description:
    "Fetches Strapi data of a given collection and repeats content of children once for every row fetched.",
  defaultStyles: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gridRowGap: "8px",
    gridColumnGap: "8px",
    padding: "8px",
    maxWidth: "100%",
  },
  props: {
    children: {
      type: "slot",
      defaultValue: {
        type: "vbox",
        children: {
          type: "component",
          name: "StrapiField2",
        },
      },
    },
    name: {
      type: "string",
      displayName: "Name",
      description: "Name of the collection to be fetched.",
      defaultValueHint: "restaurants",
    },
    filter: {
      type: "object",
      displayName: "Filter",
      description: "Filter applied to the collection to be fetched.",
    },
    variables: {
      type: "object",
      displayName: "Variables",
      description: "Variables used in the filters."
    },
    noLayout: {
      type: "boolean",
      displayName: "No layout",
      description:
        "When set, Strapi Collection will not layout its children; instead, the layout set on its parent element will be used. Useful if you want to set flex gap or control container tag type.",
      defaultValue: false,
    },
  },
};

const parseString = (str: string, vars: Record<string, string>) => {
  const m = new Set(str.match(/{{[^}]*}}/g));
  if (!m) return str;
  m.forEach(variable => {
    const valid = variable.slice(2, -2);
    if (!(valid in vars)) {
      throw new Error("Variable not found")
    }
    str = str.replaceAll(variable, vars[valid])
  });
  return str;
}
const parseFilter = (filter: Record<string, any>, vars: Record<string, string>) => {
  const parseItem = (item: any): any => typeof item === "string"
    ? parseString(item, vars)
    : Array.isArray(item)
      ? item.map(el => parseItem(el))
      : typeof item === "object"
        ? parseFilter(item, vars)
        : item

  const parsedObj: any = {}
  for (const key in filter) {
    parsedObj[parseString(key, vars)] = parseItem(filter[key])
  }
  return parsedObj;
}

function strapiGet(
  path: string,
  query: Record<string, any>,
  creds: StrapiCredentialsProviderProps
) {
  const opts: Record<string, any> = {
    method: "GET"
  };
  if (creds.token) {
    opts.headers = {
      "Authorization": `Bearer ${creds.token}`
    };
  }
  console.log(`strapiGet: ${creds.host}${path}?${qs.stringify(query, {encodeValuesOnly: true})}`)
  return fetch(`${creds.host}${path}?${qs.stringify(query, {encodeValuesOnly: true})}`, opts)
}

export function StrapiCollection({
  name,
  children,
  noLayout,
  filter,
  variables,
  ...rest
}: StrapiCollectionProps) {
  const creds = ensure(useContext(CredentialsContext));

  const dataKey = JSON.stringify({creds, name, filter, variables, type: "query"});
  const { data, error, isLoading } = usePlasmicQueryData<any[] | null>(dataKey, async () => {
    if (!creds.host || !name) {
      return null;
    }

    const query = {
      ...(parseFilter(filter ?? {}, variables ?? {}) ?? {})
    };
    const resp = await strapiGet(`/api/${name}`, query, creds);
    return resp.json();
  });

  if (!creds.host) {
    return <div {...rest}>Please specify a Strapi host and token.</div>;
  }

  if (!name) {
    return <div {...rest}>Please specify a valid collection name.</div>;
  }

  if (error) {
    try {
      const x = parseFilter(filter ?? {}, variables ?? {});
    } catch(err) {
      return <div>Variable not found</div>
    }
    return <div {...rest}>Error fetching Strapi collection.</div>
  }

  if (!data) {
    // loading...
    return null;
  }

  const collection = L.get(data, ["data"]) as any[];

  const repElements = collection.map((item, index) => (
    <DataProvider key={item.id} name={"strapiItem"} data={item}>
      {repeatedElement(index === 0, children)}
    </DataProvider>
  ));

  const content = (
      repElements
  )

  return noLayout ? (
    <> {content} </>
  ) : (
    <div {...rest}> {content} </div>
  );
}

interface StrapiFieldProps {
  className?: string;
  path?: string;
  setControlContextData?: (data: {
    data: any;
  }) => void;
}

export const strapiFieldMeta: ComponentMeta<StrapiFieldProps> = {
  name: "StrapiField2",
  displayName: "Strapi Field",
  importName: "StrapiField",
  importPath: modulePath,
  props: {
    path: {
      type: "dataSelector",
      data: (_: any, ctx: any) => ctx?.data ?? {},
      displayName: "Field",
      description: "Field name",
    }
  },
};

export function StrapiField({
  path, //Note: path is Field Name
  setControlContextData,
  ...rest
}: StrapiFieldProps) {
  const item = useSelector("strapiItem");
  const creds = ensure(useContext(CredentialsContext));

  if (!item) {
    return <div>StrapiField must be used within a StrapiCollection</div>;
  }

  setControlContextData?.({
    data: item
  });

  if (!path) {
    return <div>StrapiField must specify a field name.</div>;
  }

  const data = L.get(item, path);

  if (!data) {
    return <div>Please specify a valid field name.</div>;
  } else if (data?.data?.attributes?.mime.startsWith("image")) {
    const attrs = data.data.attributes;
    const img_url = attrs.url.startsWith("http")
      ? attrs.url
      : creds.host + attrs.url;
    const img_width = attrs.width;
    const img_height = attrs.height;
    return (
      <img
        {...rest}
        src={img_url}
        width={300}
        height={(300 * img_height) / img_width}
      />
    );
  } else {
    return <div {...rest}>{data}</div>;
  }
}


interface StrapiRepeatedElementProps {
  className?: string;
  path?: string;
  children?: React.ReactNode;
  setControlContextData?: (data: {
    data: any;
  }) => void;
}

export const strapiRepeatedElementMeta: ComponentMeta<StrapiRepeatedElementProps> = {
  name: "StrapiRepeatedElement",
  displayName: "Strapi Repeated Element",
  importName: "StrapiRepeatedElement",
  importPath: modulePath,
  props: {
    path: {
      type: "dataSelector",
      data: (_: any, ctx: any) => ctx?.data ?? {},
      displayName: "Element",
      description: "Element name name",
    },
    children: "slot"
  },
};

export function StrapiRepeatedElement({
  path, //Note: path is Field Name
  children,
  setControlContextData,
  ...rest
}: StrapiRepeatedElementProps) {
  const item = useSelector("strapiItem");
  if (!item) {
    return <div>StrapiField must be used within a StrapiCollection</div>;
  }

  setControlContextData?.({
    data: item
  });

  if (!path) {
    return <div>StrapiField must specify a field name.</div>;
  }

  const data = L.get(item, path);

  if (L.isArray(data)) {
    return <>
    {data.map((item, i) =>
      <DataProvider data={{index: i+1, item}} name={"strapiItem"} key={i}>
        {repeatedElement(i === 0, children)}
      </DataProvider>
    )}
    </>
  } else {
    return <div>Please specify a valid field name.</div>;
  } 
}