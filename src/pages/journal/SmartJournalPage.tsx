import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { PlaceholderPage } from '../PlaceholderPage'

export function SmartJournalPage() {
  return (
    <PlaceholderPage
      description="Journal placeholder for emotions, mistake checklist, grade, result, screenshots, and linked trades."
      phase="Phase 9"
      title="Smart Journal"
    >
      <section className="grid gap-4 md:grid-cols-3">
        <Select label="Trade grade">
          <option>A</option>
          <option>B</option>
          <option>C</option>
          <option>D</option>
        </Select>
        <Select label="Result">
          <option>Win</option>
          <option>Loss</option>
          <option>Breakeven</option>
        </Select>
        <Select label="Emotion before">
          <option>Calm</option>
          <option>Anxious</option>
          <option>Confident</option>
        </Select>
      </section>
      <Textarea label="Journal notes" placeholder="Reflect on execution quality and discipline." />
    </PlaceholderPage>
  )
}
