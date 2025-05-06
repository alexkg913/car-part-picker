import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export function TabsDemo() {
  return (
    <Tabs defaultValue="Stage 1" className="w-[600px] h-[600px]">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="Stage 1">Stage 1</TabsTrigger>
        <TabsTrigger value="Stage 2">Stage 2</TabsTrigger>
        <TabsTrigger value="Stage 3">Stage 3</TabsTrigger>
        <TabsTrigger value="max">Max Effort</TabsTrigger>
      </TabsList>
      <TabsContent value="Stage 1">
        <Card>
          <CardHeader>
            <CardTitle>Stage 1</CardTitle>
            <CardDescription>
             This is a list of bolt-ons required for stage 1 on a VW/Audi MQB car
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            Cold Air Intake (Optional)
            <br/>
            High Flow or Catless Downpipe (Not Supported)
            <br/>
            Colder spark plugs (Highly Recomended)
            <br/>
            Turbo Inlet (Optional)
            <br/>
            Turbo Muffler Delete (Optional)
            <br/>
            Upgraded Clutch or DSG Tune (Optional)
            <br/>
            Upgraded HPFP or Multi Port Injection (For E85 fuel, otherwise, it is optional)
            <br/>
          </CardContent>
          <CardFooter>
          Always consult your tuner for their own specific requirements.
          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="Stage 2">
        <Card>
          <CardHeader>
            <CardTitle>Stage 2</CardTitle>
            <CardDescription>
              This is a list of bolt-ons required for stage 2 on a VW/Audi MQB car
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            Cold Air Intake
            <br/>
            High flow or Catless Downpipe 
            <br/>
            Colder spark plugs (Highly Recomended)
            <br/>
            Turbo Inlet (Optional)
            <br/>
            Turbo Muffler Delete (Optional)
            <br/>
            Upgraded Clutch or DSG Tune
            <br/>
            Upgraded HPFP or Multi Port Injection (For E85 fuel, otherwise, it is optional)
            <br/>
          </CardContent>
          <CardFooter>
            Always consult your tuner for their own specific requirements.
          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="Stage 3">
        <Card>
          <CardHeader>
            <CardTitle>Stage 3</CardTitle>
            <CardDescription>
              This is a list of bolt-ons required for stage 3 on a VW/Audi MQB car
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            Cold Air Intake
            <br/>
            High flow or Catless Downpipe 
            <br/>
            Colder spark plugs
            <br/>
            Turbo Inlet (Optional)
            <br/>
            Turbo Muffler Delete (Optional)
            <br/>
            Upgraded Clutch or DSG Tune
            <br/>
            Upgraded Turbo
            <br/>
            Upgraded HPFP or Multi Port Injection (For E85 fuel, otherwise, it is optional)
            <br/>
          </CardContent>
          <CardFooter>
            Always consult your tuner for their own specific requirements.
          </CardFooter>
        </Card>
      </TabsContent>
      <TabsContent value="max">
        <Card>
          <CardHeader>
            <CardTitle>Max Effort</CardTitle>
            <CardDescription>
              This is what is considered "Max Effort" or FBO for a VW/Audi MQB car
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            Cold Air Intake
            <br/>
            High flow or Catless Downpipe 
            <br/>
            Colder spark plugs
            <br/>
            Turbo Inlet
            <br/>
            Turbo Muffler Delete
            <br/>
            Upgraded Clutch or DSG Tune
            <br/>
            Upgraded Turbo
            <br/>
            Multi Port Injection
            <br/>
            Upgraded HPFP
            <br/>
            Water Meth Injection
            <br/>
          </CardContent>
          <CardFooter>
            Always consult your tuner for their own specific requirements.
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}