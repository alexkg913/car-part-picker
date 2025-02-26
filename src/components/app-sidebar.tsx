import * as React from "react"

import { SearchForm } from "@/components/search-form"
import { VersionSwitcher } from "@/components/version-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/ModeToggle"
import { NavUser } from "@/components/nav-user"


const data = {
  cars: ["Volkswagen Golf GTI", "Volkswagen Golf R", "Audi S3", "Audi A3", "Ford Mustang (S197)"],
  user: {
        name: "Test Account",
        email: "test@test.com",
        avatar: "/kyle.jpg",
      },
  navMain: [
    {
      title: "Builder",
      url: "../builder",
      items: [
        {
          title: "Build configurator",
          url: "../builder/configurator",
        }
      ]
    },
    {
      title: "Parts",
      url: "../parts",
      items: [
        {
          title: "Engine Parts",
          url: "../parts/engine-parts",
        },
        {
          title: "Suspension Parts",
          url: "../parts/suspension-parts",
        },
        {
          title: "Brake Parts",
          url: "../parts/brake-parts",
        },
      ],
    },
    {
      title: "Upgrade Paths",
      url: "#",
      items: [
        {title: "Bolt On Upgrades",
        url: "../upgrade-paths/bolt-ons",
      },
      ],

    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <VersionSwitcher
          cars={data.cars}
          defaultCar={data.cars[0]}
        />
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.isActive}>
                      <a href={item.url}>{item.title}</a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
      <SidebarFooter>
      <ModeToggle>
      </ModeToggle>
      <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
