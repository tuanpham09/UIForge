import { Button } from "components/ui/button";
import { Card } from "components/ui/card";
import { Input } from "components/ui/input";

export function MappedComponentsCompileFixture() {
  return (
    <Card>
      <Input placeholder="Search" />
      <Button variant="secondary">Apply</Button>
    </Card>
  );
}
