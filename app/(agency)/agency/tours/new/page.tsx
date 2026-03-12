import { TourForm } from '../tour-form';

export default function NewTourPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Create New Tour</h1>
        <p className="text-sm text-muted-foreground">
          Fill in the details below to create a new tour package
        </p>
      </div>
      <TourForm />
    </div>
  );
}
