import { initPlasmicLoader } from "@plasmicapp/loader-nextjs";
import Collapse from "./components/Collapse";
import Slider, { SliderButton, SliderProvider } from "./components/Slider";
import { ButtonAction } from "./components/ButtonAction";
import { registerAll as strapiRegisterAll } from "./components/strapi";
import RegimenNavMenu from "./components/RegimenNavMenu";
import RegimenColorTheme from "./components/RegimenColorTheme";

export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id: "3mR8q9fMFTRpAF3XbXcrhx",  // ID of a project you are using
      token: "HRm45h3EhYkXOexCONCxwhA88ks6VGBQhIFu6BdPqGfKl9kmspKM76PNo9RulwVuCsxncvwlMPwXFK6sVEV0g"  // API token for that project
    },
  ],

  // By default Plasmic will use the last published version of your project.
  // For development, you can set preview to true, which will use the unpublished
  // project, allowing you to see your designs without publishing.  Please
  // only use this for development, as this is significantly slower.
  preview: true,
});

// You can register any code components that you want to use here; see
// https://docs.plasmic.app/learn/code-components-ref/
// And configure your Plasmic project to use the host url pointing at
// the /plasmic-host page of your nextjs app (for example,
// http://localhost:3000/plasmic-host).  See
// https://docs.plasmic.app/learn/app-hosting/#set-a-plasmic-project-to-use-your-app-host

// PLASMIC.registerComponent(...);


PLASMIC.registerComponent(Collapse, {
  name: "Collapse",
  description: "A collapsible component",
  props: {
    children: {
      type: "slot",
      defaultValue: "Collapse component body",
    },
    header: {
      type: "slot",
      defaultValue: "Collapse component header",
    },
    previewOpen: "boolean",
  },
});

PLASMIC.registerComponent(SliderProvider, {
  name: "SliderProvider",
  props: {
    children: {
      type: "slot",
    },
  },
});

PLASMIC.registerComponent(Slider, {
  name: "CustomSlider",
  defaultStyles: {
    overflowX: "auto",
  },
  props: {
    children: {
      type: "slot",
    },
  },
});

PLASMIC.registerComponent(SliderButton, {
  name: "SliderButton",
  props: {
    action: {
      type: "choice",
      options: ["right", "left"],
      defaultValue: "right",
    },
    children: {
      type: "slot",
      defaultValue: {
        type: "text",
        value: ">",
        style: {
          padding: "8px",
        },
      },
    },
  },
})

PLASMIC.registerComponent(ButtonAction, {
  name: "ButtonAction",
  props: {
    children: "slot"
  },
  isAttachment: true
});

PLASMIC.registerComponent(RegimenColorTheme, {
  name: "Regimen Color Theme",
  props: {
    children: "slot",
    type: {
      type: "choice",
      options: ["color", "backgroundColor"]
    },
    variables: "object"
  },
  isAttachment: true
});

strapiRegisterAll(PLASMIC);
PLASMIC.registerComponent(RegimenNavMenu, {
  name: "RegimenNavMenu",
  props: {
    activeRegimen: "slot",
    nonActiveRegimen: "slot"
  }
})
