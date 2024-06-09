import { Badge, Box, Flex, Spinner, Text, useColorModeValue } from "@chakra-ui/react";
import { FaCheckCircle } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { Todo } from "./TodoList";
import { useMutation } from "@tanstack/react-query";
import { BASE_URL } from "../App";
import { IoMdUndo } from "react-icons/io";
import { useToastContext } from "../providers/ToastProvider";

const updateTodoService = async (todo: Todo) => {
  const res = await fetch(BASE_URL + `/todos/${todo.id}`, {
    method: "PATCH",
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      completed: !todo.completed
    })
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || "Something weng wrong")
  }
  return data;
}

const deleteTodoService = async (todo: Todo) => {
  const res = await fetch(BASE_URL + `/todos/${todo.id}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Something went wrong");
  }
  return data;
}

const TodoItem = ({ todo, removeTodo, editTodo }: { todo: Todo, removeTodo: any, editTodo: any }) => {
  // const queryClient = useQueryClient();
  // const toast = useToast();
  const { addToast } = useToastContext()

  const { mutate: updateTodo, isPending: isUpdating } = useMutation({
    mutationKey: ["updateTodo"],
    mutationFn: updateTodoService,
    onSuccess: (data) => {
      editTodo(data)
      // queryClient.invalidateQueries({ queryKey: ["todos"] })
      addToast('Todo ' + (data.completed ? 'completed' : 'in-progress'), 'success', {
        description: data.body,
      })
    },
    onError: (error) => {
      console.log(error);
      addToast('Error', 'error', {
        description: error.message,
      })
    }
  })

  const { mutate: deleteTodo, isPending: isDeleting } = useMutation({
    mutationKey: ["deleteTodo"],
    mutationFn: deleteTodoService,
    onSuccess: () => {
      removeTodo(todo.id)
      // queryClient.invalidateQueries({ queryKey: ["todos"] });
      addToast('Todo deleted', 'success',  {
        description: todo.body,
      })
    },
    onError: (error) => {
      console.log(error);
      addToast('Error', 'error', {
        description: error.message,
      })
    }
  });

  return (
    <Flex gap={2} alignItems={"center"}>
      <Flex
        flex={1}
        alignItems={"center"}
        border={"1px"}
        borderColor={"gray.600"}
        p={2}
        borderRadius={"lg"}
        justifyContent={"space-between"}
      >
        <Text
          // color={todo.completed ? "green" : "yellow"}
          color={todo.completed ? useColorModeValue('green.500', 'green.200') : useColorModeValue('yellow.400', 'yellow.100')}
          textDecoration={todo.completed ? "line-through" : "none"}
        >
          {todo.body}
        </Text>
        {todo.completed && (
          <Badge ml='1' colorScheme='green'>
            Done
          </Badge>
        )}
        {!todo.completed && (
          <Badge ml='1' colorScheme='yellow'>
            In Progress
          </Badge>
        )}
      </Flex>
      <Flex gap={2} alignItems={"center"}>
        <Box color={"green.500"} cursor={"pointer"} onClick={() => updateTodo(todo)}>
          {!isUpdating
            ? todo.completed
              ? <IoMdUndo size={20} />
              : <FaCheckCircle size={20} />
            : <Spinner size={"sm"} />
          }
        </Box>
        <Box color={"red.500"} cursor={"pointer"} onClick={() => deleteTodo(todo)}>
          {!isDeleting
            ? <MdDelete size={24} />
            : <Spinner size={"sm"} />
          }
        </Box>
      </Flex>
    </Flex>
  );
};
export default TodoItem;
